import bcrypt from 'bcrypt';
import { AuthRepository } from './auth.repository.js';
import { LoginRequest, RegisterRequest, RegisterEmployerRequest } from './auth.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { AuthenticatedUser } from '../../shared/types/common.types.js';
import { validatePassword } from '../../shared/utils/password-validator.js';
import type { BillingService } from '../billing/billing.service.js';
import { parseJwtTenantIdFromPayload } from '../../shared/auth/jwt-tenant.js';
import { buildAuthenticatedUser, isSuperAdmin } from '../../shared/auth/principal.js';
import type { EmployeesRepository } from '../employees/employees.repository.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  system_role: 'super_admin' | 'user';
}

export interface AuthTenantResponse {
  id: string;
  name: string;
  slug: string;
  plan_id: string | null;
  is_active: boolean;
}

export interface AuthMembershipResponse {
  user_id: string;
  tenant_id: string;
  role: 'ADMIN' | 'EMPLOYEE';
}

export interface AuthSuccessResponse extends TokenPair {
  user: AuthUserResponse;
  tenant: AuthTenantResponse | null;
  memberships: AuthMembershipResponse[];
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
    let user: { id: string; tenant_id: string | null; password_hash: string } | null = null;

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

    return this.buildAuthResponse(user.id, user.tenant_id);
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
    const companyName = payload.companyName?.trim() || payload.name.trim();
    const slugBase = this.slugify(companyName);

    let createdSession: { userId: string; tenantId: string };
    try {
      createdSession = await this.authRepository.withTransaction(async (tx) => {
        const slug = await this.resolveUniqueTenantSlug(slugBase, tx);
        const created = await this.authRepository.createEmployerWithTenant(
          {
            companyName,
            slug,
            ownerName: payload.name,
            email: payload.email ?? null,
            phone: payload.phone ?? null,
            passwordHash,
          },
          tx
        );
        await this.authRepository.ensureDefaultTrialSubscription(created.tenantId, tx);
        return created;
      });
    } catch (error) {
      const pgError = error as { code?: string };
      if (pgError?.code === '23505') {
        throw ApplicationError.conflict('User or tenant already exists');
      }
      throw error;
    }

    return this.buildAuthResponse(createdSession.userId, createdSession.tenantId);
  }

  /** Issue tokens after user row exists (e.g. link-invite acceptance). */
  async issueSessionAfterRegistration(email: string): Promise<AuthSuccessResponse> {
    const full = await this.authRepository.findUserByEmail(email.toLowerCase());
    if (!full) {
      throw ApplicationError.internal('Failed to load user after registration');
    }
    return this.buildAuthResponse(full.id, full.tenant_id);
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
    return this.buildAuthResponse(full.id, full.tenant_id);
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

  private async buildAuthResponse(
    userId: string,
    requestedTenantId: string | null
  ): Promise<AuthSuccessResponse> {
    const full = await this.authRepository.getAuthSessionUserById(userId);
    if (!full) {
      throw ApplicationError.unauthorized('Invalid user session');
    }
    const userIsSuperAdmin = isSuperAdmin({
      email: full.email,
      system_role: full.system_role,
    });
    const authCtx = await this.authRepository.findAuthContextById(
      full.id,
      userIsSuperAdmin ? null : requestedTenantId
    );
    if (!authCtx) {
      throw ApplicationError.unauthorized('User context unavailable');
    }
    const principal = buildAuthenticatedUser(
      authCtx,
      userIsSuperAdmin ? null : requestedTenantId
    );

    const memberships = userIsSuperAdmin
      ? []
      : await this.authRepository.listMembershipsForUser(full.id);
    const currentTenantId = principal.tenant_id;
    const tenant =
      currentTenantId && !userIsSuperAdmin
        ? await this.authRepository.getTenantById(currentTenantId)
        : null;

    const jwtPayload: JwtPrincipalPayload = {
      ...principal,
    };

    return {
      accessToken: this.signAccessToken(jwtPayload, '15m'),
      refreshToken: this.signRefreshToken(jwtPayload, '7d'),
      user: {
        id: full.id,
        email: full.email,
        first_name: full.first_name,
        last_name: full.last_name,
        system_role: principal.system_role === 'super_admin' ? 'super_admin' : 'user',
      },
      tenant,
      memberships,
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

  private slugify(name: string): string {
    const normalized = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 50);
    return normalized || 'tenant';
  }

  private async resolveUniqueTenantSlug(
    base: string,
    executor: Parameters<AuthRepository['slugExists']>[1]
  ): Promise<string> {
    let candidate = base;
    let suffix = 1;
    while (await this.authRepository.slugExists(candidate, executor)) {
      suffix += 1;
      candidate = `${base}-${suffix}`;
    }
    return candidate;
  }
}
