import bcrypt from 'bcrypt';
import { AuthRepository, UserWithTenantRecord } from './auth.repository.js';
import { LoginRequest, RegisterRequest, RegisterEmployerRequest } from './auth.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { AuthenticatedUser, Role } from '../../shared/types/common.types.js';
import { validatePassword } from '../../shared/utils/password-validator.js';
import type { BillingService } from '../billing/billing.service.js';
import { parseJwtTenantIdFromPayload } from '../../shared/auth/jwt-tenant.js';
import { buildAuthenticatedUser } from '../../shared/auth/principal.js';
import type { EmployeesRepository } from '../employees/employees.repository.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserResponse {
  userId: string;
  tenantId: string;
  tenantName: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  systemRole: 'super_admin' | 'user';
}

export interface AuthSuccessResponse extends TokenPair {
  user: AuthUserResponse;
}

type JwtPrincipalPayload = AuthenticatedUser & { tokenType?: 'access' | 'refresh' };

type TokenSigner = (payload: JwtPrincipalPayload, expiresIn: string) => string;
type TokenVerifier = (token: string) => JwtPrincipalPayload;

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly signAccessToken: TokenSigner,
    private readonly signRefreshToken: TokenSigner,
    private readonly verifyRefreshToken: TokenVerifier,
    private readonly billing: BillingService,
    private readonly employeesRepository: EmployeesRepository
  ) {}

  async login(payload: LoginRequest): Promise<AuthSuccessResponse> {
    let user: UserWithTenantRecord | null = null;

    if (payload.email) {
      user = await this.authRepository.findUserByEmail(payload.email);
    } else if (payload.phone) {
      user = await this.authRepository.findUserByPhone(payload.phone);
    }

    if (!user) {
      throw ApplicationError.unauthorized('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw ApplicationError.unauthorized('Invalid credentials');
    }

    return this.buildAuthResponse(user);
  }

  /**
   * Public employer self-registration:
   * Creates tenant + owner user + activates 15-day trial.
   * No invite token required.
   */
  async registerEmployer(payload: RegisterEmployerRequest): Promise<AuthSuccessResponse> {
    if (!payload.email && !payload.phone) {
      throw ApplicationError.badRequest('Either email or phone is required');
    }

    if (payload.email) {
      const existing = await this.authRepository.findUserByEmail(payload.email);
      if (existing) {
        throw ApplicationError.conflict('Email is already registered');
      }
    }

    if (payload.phone) {
      const existing = await this.authRepository.findUserByPhone(payload.phone);
      if (existing) {
        throw ApplicationError.conflict('Phone number is already registered');
      }
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const slug = this.generateSlug(payload.companyName);

    const { tenantId, userId } = await this.authRepository.createEmployerWithTenant({
      companyName: payload.companyName,
      slug,
      ownerName: payload.name,
      email: payload.email ?? null,
      phone: payload.phone ?? null,
      passwordHash,
    });

    // Activate 15-day trial for new tenant
    await this.billing.ensureSubscriptionForNewTenant(tenantId);

    const identifier = payload.email ?? payload.phone ?? userId;
    const full = payload.email
      ? await this.authRepository.findUserByEmail(payload.email)
      : await this.authRepository.findUserByPhone(payload.phone!);

    if (!full) {
      throw ApplicationError.internal('Failed to load user after registration');
    }
    return this.buildAuthResponse(full);
  }

  private generateSlug(name: string): string {
    const base = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 50);
    const suffix = Math.random().toString(36).slice(2, 7);
    return `${base || 'company'}-${suffix}`;
  }

  /** Issue tokens after user row exists (e.g. link-invite acceptance). */
  async issueSessionAfterRegistration(email: string): Promise<AuthSuccessResponse> {
    const full = await this.authRepository.findUserByEmail(email.toLowerCase());
    if (!full) {
      throw ApplicationError.internal('Failed to load user after registration');
    }
    return this.buildAuthResponse(full);
  }

  /**
   * Fixed registration flow (from multi-tenancy vulnerability):
   * - Requires valid invite token (prevents unauthorized tenant joins)
   * - Invite token contains tenantId + assigned role
   * - Creates user only after validating invite
   * - Marks invite as "used" with user ID
   */
  async register(payload: RegisterRequest): Promise<AuthSuccessResponse> {
    // Step 1: Validate password strength
    const passwordValidation = validatePassword(payload.password);
    if (!passwordValidation.valid) {
      throw ApplicationError.badRequest(
        `Password requirements not met: ${passwordValidation.errors.join('; ')}`
      );
    }

    // Step 2: Find and validate invite token
    const invite = await this.authRepository.findInviteByToken(payload.inviteToken);
    if (!invite) {
      throw ApplicationError.unauthorized(
        'Invalid or expired invite token. Please request a new invitation.'
      );
    }

    // Step 3: Verify email matches invite
    if (invite.email.toLowerCase() !== payload.email.toLowerCase()) {
      throw ApplicationError.forbidden(
        'Email does not match the invitation. Please use the invited email address.'
      );
    }

    // Step 4: Check user doesn't already exist
    const existingUser = await this.authRepository.findUserByEmail(payload.email);
    if (existingUser) {
      throw ApplicationError.conflict('Email is already registered');
    }

    // Step 5: Hash password and create user
    const passwordHash = await bcrypt.hash(payload.password, 12);
    const [firstName, lastName] = this.extractNamesFromEmail(payload.email);

    const occupiesBillableSeat = invite.role !== 'ADMIN';

    await this.billing.runAtomicUserCreation(
      invite.tenant_id,
      { occupiesBillableSeat },
      async (tx) => {
        const user = await this.authRepository.createUser(
        {
          tenant_id: invite.tenant_id,
          email: payload.email.toLowerCase(),
          password_hash: passwordHash,
          first_name: firstName,
          last_name: lastName,
          role: invite.role,
          is_active: true,
        },
        tx
        );

        await this.authRepository.markInviteAsUsed(invite.id, user.id, tx);

        const tenantRole =
          invite.role === 'ADMIN' ? 'owner' : invite.role === 'MANAGER' ? 'manager' : 'employee';
        await this.employeesRepository.upsertTenantMembership(
          user.id,
          invite.tenant_id,
          tenantRole,
          tx
        );

        return user;
      }
    );

    const full = await this.authRepository.findUserByEmail(payload.email.toLowerCase());
    if (!full) {
      throw ApplicationError.internal('Failed to load user after registration');
    }
    return this.buildAuthResponse(full);
  }

  /**
   * Refresh access token using refresh token.
   * Validates that user/tenant still exist and are active.
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      const decoded = this.verifyRefreshToken(refreshToken);
      if (decoded.tokenType && decoded.tokenType !== 'refresh') {
        throw ApplicationError.unauthorized('Invalid refresh token');
      }

      const rawSub = (decoded as unknown as { sub?: string }).sub;
      const userId =
        decoded.userId ?? decoded.id ?? (typeof rawSub === 'string' ? rawSub : undefined);
      if (!userId) {
        throw ApplicationError.unauthorized('Invalid refresh token');
      }

      const jwtTenant = parseJwtTenantIdFromPayload(decoded);

      const active = await this.authRepository.findActiveUserById(userId);
      if (!active) {
        throw ApplicationError.unauthorized('User no longer exists');
      }

      const ctx = await this.authRepository.findAuthContextById(userId, jwtTenant);
      if (!ctx) {
        throw ApplicationError.unauthorized('User or tenant no longer exists');
      }

      const principal = buildAuthenticatedUser(ctx, jwtTenant);

      return {
        accessToken: this.signAccessToken({ ...principal, tokenType: 'access' }, '15m'),
        refreshToken: this.signRefreshToken({ ...principal, tokenType: 'refresh' }, '7d'),
      };
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.unauthorized('Invalid or expired refresh token');
    }
  }

  private buildAuthResponse(user: UserWithTenantRecord): AuthSuccessResponse {
    const isSuperAdmin = user.system_role === 'super_admin';
    const principal = buildAuthenticatedUser(
      {
        id: user.id,
        email: user.email,
        system_role: user.system_role,
        legacy_role: user.role,
        user_primary_tenant_id: isSuperAdmin ? null : user.tenant_id,
        effective_tenant_id: isSuperAdmin ? null : user.tenant_id,
        membership_role: isSuperAdmin ? null : user.tenant_membership_role,
        tenant_plan: null,
      },
      isSuperAdmin ? null : user.tenant_id
    );

    const jwtPayload: JwtPrincipalPayload = {
      ...principal,
    };

    return {
      accessToken: this.signAccessToken(jwtPayload, '15m'),
      refreshToken: this.signRefreshToken(jwtPayload, '7d'),
      user: {
        userId: user.id,
        tenantId: principal.tenant_id ?? '',
        tenantName: user.tenant_name ?? '',
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: principal.role as Role,
        systemRole: principal.system_role === 'super_admin' ? 'super_admin' : 'user',
      },
    };
  }

  private extractNamesFromEmail(email: string): [string, string] {
    const localPart = email.split('@')[0];
    const cleaned = localPart
      .replace(/[^a-zA-Z0-9._-]/g, '')
      .replace(/[._-]+/g, ' ')
      .trim();

    if (!cleaned) {
      return ['User', 'Account'];
    }

    const tokens = cleaned.split(' ').filter(Boolean);
    const firstName = this.capitalize(tokens[0] ?? 'User');
    const lastName = this.capitalize(tokens.slice(1).join(' ') || 'Account');

    return [firstName, lastName];
  }

  private capitalize(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
