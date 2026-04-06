import bcrypt from 'bcrypt';
import { AuthRepository, UserWithTenantRecord, TenantInviteRecord } from './auth.repository.js';
import { LoginRequest, RegisterRequest } from './auth.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { AuthenticatedUser, Role } from '../../shared/types/common.types.js';
import { validatePassword } from '../../shared/utils/password-validator.js';

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
}

export interface AuthSuccessResponse extends TokenPair {
  user: AuthUserResponse;
}

type TokenSigner = (payload: AuthenticatedUser, expiresIn: string) => string;
type TokenVerifier = (token: string) => AuthenticatedUser;

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly signToken: TokenSigner,
    private readonly verifyToken: TokenVerifier
  ) {}

  async login(payload: LoginRequest): Promise<AuthSuccessResponse> {
    const user = await this.authRepository.findUserByEmail(payload.email);

    if (!user) {
      throw ApplicationError.unauthorized('Invalid email or password');
    }

    const isPasswordValid = await bcrypt.compare(
      payload.password,
      user.password_hash
    );

    if (!isPasswordValid) {
      throw ApplicationError.unauthorized('Invalid email or password');
    }

    return this.buildAuthResponse(user);
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

    const createdUser = await this.authRepository.createUser({
      tenant_id: invite.tenant_id,
      email: payload.email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: invite.role,
      is_active: true,
    });

    // Step 6: Mark invite as used
    await this.authRepository.markInviteAsUsed(invite.id, createdUser.id);

    // Step 7: Return auth response (need tenant name)
    return this.buildAuthResponse({
      ...createdUser,
      tenant_name: invite.tenant_id, // Will be replaced by fetching tenant in a real scenario
    });
  }

  /**
   * Refresh access token using refresh token.
   * Validates that user/tenant still exist and are active.
   */
  async refreshTokens(refreshToken: string): Promise<TokenPair> {
    try {
      // Decode refresh token (should have long expiry)
      const decoded = this.verifyToken(refreshToken);

      // For super admins (tenantId is null), just verify the user exists
      if (!decoded.tenantId) {
        const user = await this.authRepository.findUserById(decoded.userId);
        if (!user) {
          throw ApplicationError.unauthorized('Super admin user no longer exists');
        }
      } else {
        // Verify user and tenant still exist and are active
        const user = await this.authRepository.findUserByIdAndTenant(
          decoded.userId,
          decoded.tenantId
        );

        if (!user) {
          throw ApplicationError.unauthorized('User or tenant no longer exists');
        }
      }

      // Create new token pair
      return {
        accessToken: this.signToken(decoded, '15m'),
        refreshToken: this.signToken(decoded, '7d'),
      };
    } catch (error) {
      if (error instanceof ApplicationError) {
        throw error;
      }
      throw ApplicationError.unauthorized('Invalid or expired refresh token');
    }
  }

  private buildAuthResponse(user: UserWithTenantRecord): AuthSuccessResponse {
    const jwtPayload: AuthenticatedUser = {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role as Role,
      tenantPlan: user.tenant_plan as 'FREE' | 'PRO' | 'ENTERPRISE',
      is_super_admin: (user as any).is_super_admin,
    };

    return {
      accessToken: this.signToken(jwtPayload, '15m'),
      refreshToken: this.signToken(jwtPayload, '7d'),
      user: {
        userId: user.id,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name ?? 'Platform Admin',
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role as Role,
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
