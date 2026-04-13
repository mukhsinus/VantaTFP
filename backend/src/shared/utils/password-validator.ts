export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Simple employee password validation: min 4 chars, no complexity requirements (per spec).
 */
export function validateEmployeePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < 4) {
    errors.push('Password must be at least 4 characters');
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Employer password validation: min 8 chars.
 */
export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];

  if (!password) {
    return { valid: false, errors: ['Password is required'] };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  return { valid: errors.length === 0, errors };
}
