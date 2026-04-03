import bcrypt from 'bcrypt';
import { AuthRepository, UserWithTenantRecord } from './auth.repository.js';
import { LoginRequest, RegisterRequest } from './auth.schema.js';
import { ApplicationError } from '../../shared/utils/application-error.js';
import { AuthenticatedUser, Role } from '../../shared/types/common.types.js';

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

export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly signToken: TokenSigner
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
   * MVP testing flow:
   * - accepts only email + password
   * - forces ADMIN role for created user
   * - reuses first active tenant, or creates a default tenant if none exists
   */
  async register(payload: RegisterRequest): Promise<AuthSuccessResponse> {
    const existingUser = await this.authRepository.findUserByEmail(payload.email);

    if (existingUser) {
      throw ApplicationError.conflict('Email is already registered');
    }

    const tenant =
      (await this.authRepository.findFirstActiveTenant()) ??
      (await this.authRepository.createDefaultTenant(
        'Default Tenant',
        `default-tenant-${Date.now()}`
      ));

    const passwordHash = await bcrypt.hash(payload.password, 12);

    const [firstName, lastName] = this.extractNamesFromEmail(payload.email);

    const createdUser = await this.authRepository.createUser({
      tenant_id: tenant.id,
      email: payload.email.toLowerCase(),
      password_hash: passwordHash,
      first_name: firstName,
      last_name: lastName,
      role: 'ADMIN',
      is_active: true,
    });

    return this.buildAuthResponse({
      ...createdUser,
      tenant_name: tenant.name,
    });
  }

  async refreshTokens(_refreshToken: string): Promise<TokenPair> {
    throw ApplicationError.badRequest('Refresh token flow not implemented yet');
  }

  private buildAuthResponse(user: UserWithTenantRecord): AuthSuccessResponse {
    const jwtPayload: AuthenticatedUser = {
      userId: user.id,
      tenantId: user.tenant_id,
      email: user.email,
      role: user.role as Role,
    };

    return {
      accessToken: this.signToken(jwtPayload, '15m'),
      refreshToken: this.signToken(jwtPayload, '7d'),
      user: {
        userId: user.id,
        tenantId: user.tenant_id,
        tenantName: user.tenant_name,
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
      return ['Admin', 'User'];
    }

    const tokens = cleaned.split(' ').filter(Boolean);
    const firstName = this.capitalize(tokens[0] ?? 'Admin');
    const lastName = this.capitalize(tokens.slice(1).join(' ') || 'User');

    return [firstName, lastName];
  }

  private capitalize(value: string): string {
    if (!value) return value;
    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
}
