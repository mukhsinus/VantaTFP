export type ErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR'
  | 'BAD_REQUEST';

export class ApplicationError extends Error {
  public readonly statusCode: number;
  public readonly errorCode: ErrorCode;

  constructor(message: string, errorCode: ErrorCode, statusCode: number) {
    super(message);
    this.name = 'ApplicationError';
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }

  static unauthorized(message = 'Unauthorized'): ApplicationError {
    return new ApplicationError(message, 'UNAUTHORIZED', 401);
  }

  static forbidden(message = 'Forbidden'): ApplicationError {
    return new ApplicationError(message, 'FORBIDDEN', 403);
  }

  static notFound(resource: string): ApplicationError {
    return new ApplicationError(`${resource} not found`, 'NOT_FOUND', 404);
  }

  static conflict(message: string): ApplicationError {
    return new ApplicationError(message, 'CONFLICT', 409);
  }

  static badRequest(message: string): ApplicationError {
    return new ApplicationError(message, 'BAD_REQUEST', 400);
  }

  static validationError(message: string): ApplicationError {
    return new ApplicationError(message, 'VALIDATION_ERROR', 422);
  }

  static internal(message = 'Internal server error'): ApplicationError {
    return new ApplicationError(message, 'INTERNAL_ERROR', 500);
  }
}
