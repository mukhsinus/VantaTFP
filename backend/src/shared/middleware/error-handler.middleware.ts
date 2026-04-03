import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { ApplicationError } from '../utils/application-error.js';

interface ErrorResponse {
  statusCode: number;
  errorCode: string;
  message: string;
  details?: unknown;
}

/**
 * Centralized error handler registered on the Fastify instance.
 * All unhandled errors bubble up here — controllers never catch errors directly.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      request.log.error({ err: error }, 'Unhandled error');

      if (error instanceof ApplicationError) {
        const response: ErrorResponse = {
          statusCode: error.statusCode,
          errorCode: error.errorCode,
          message: error.message,
        };
        return reply.status(error.statusCode).send(response);
      }

      if (error instanceof ZodError) {
        const response: ErrorResponse = {
          statusCode: 422,
          errorCode: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: error.flatten().fieldErrors,
        };
        return reply.status(422).send(response);
      }

      // Fastify validation errors (JSON schema)
      if ('statusCode' in error && (error as { statusCode?: number }).statusCode === 400) {
        const response: ErrorResponse = {
          statusCode: 400,
          errorCode: 'BAD_REQUEST',
          message: error.message,
        };
        return reply.status(400).send(response);
      }

      const response: ErrorResponse = {
        statusCode: 500,
        errorCode: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      };
      return reply.status(500).send(response);
    }
  );
}
