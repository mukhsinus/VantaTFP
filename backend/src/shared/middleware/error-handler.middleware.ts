import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { ZodError } from 'zod';
import { ApplicationError } from '../utils/application-error.js';
import { errorEnvelope } from '../utils/response.js';

/**
 * Centralized error handler registered on the Fastify instance.
 * All unhandled errors bubble up here — controllers never catch errors directly.
 */
export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler(
    (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      if (error instanceof ApplicationError) {
        request.log.error(
          {
            err: error,
            requestId: request.id,
            method: request.method,
            url: request.url,
            statusCode: error.statusCode,
            errorCode: error.errorCode,
          },
          'Application error'
        );
        return reply
          .status(error.statusCode)
          .send(errorEnvelope(error.errorCode, error.message));
      }

      if (error instanceof ZodError) {
        const details = error.flatten().fieldErrors;
        request.log.warn(
          {
            err: error,
            requestId: request.id,
            method: request.method,
            url: request.url,
            statusCode: 422,
            errorCode: 'VALIDATION_ERROR',
            details,
          },
          'Validation error'
        );
        return reply
          .status(422)
          .send(errorEnvelope('VALIDATION_ERROR', 'Validation failed', details));
      }

      // Fastify validation errors (JSON schema)
      if ('statusCode' in error && (error as { statusCode?: number }).statusCode === 400) {
        request.log.warn(
          {
            err: error,
            requestId: request.id,
            method: request.method,
            url: request.url,
            statusCode: 400,
            errorCode: 'BAD_REQUEST',
          },
          'Bad request error'
        );
        return reply
          .status(400)
          .send(errorEnvelope('BAD_REQUEST', error.message));
      }

      request.log.error(
        {
          err: error,
          requestId: request.id,
          method: request.method,
          url: request.url,
          statusCode: 500,
          errorCode: 'INTERNAL_ERROR',
        },
        'Unhandled internal error'
      );
      return reply
        .status(500)
        .send(errorEnvelope('INTERNAL_ERROR', 'An unexpected error occurred'));
    }
  );
}
