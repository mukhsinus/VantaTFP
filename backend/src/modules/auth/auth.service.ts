import { AuthRepository } from './auth.repository.js';
import { LoginRequest, RegisterRequest } from './auth.schema.js';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  constructor(private readonly authRepository: AuthRepository) {}

  // Stub: will validate credentials and return JWT token pair
  async login(_payload: LoginRequest): Promise<TokenPair> {
    throw new Error('Not implemented');
  }

  // Stub: will hash password and persist user
  async register(_payload: RegisterRequest): Promise<{ userId: string }> {
    throw new Error('Not implemented');
  }

  // Stub: will verify and rotate refresh token
  async refreshTokens(_refreshToken: string): Promise<TokenPair> {
    throw new Error('Not implemented');
  }
}
