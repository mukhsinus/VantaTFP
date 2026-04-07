import { FastifyReply } from 'fastify';

export interface ApiErrorShape {
  errorCode: string;
  code: string;
  message: string;
  details?: unknown;
}

export interface ApiEnvelope<T> {
  data: T | null;
  error: ApiErrorShape | null;
}

export function successEnvelope<T>(data: T): ApiEnvelope<T> {
  return {
    data,
    error: null,
  };
}

export function errorEnvelope(
  code: string,
  message: string,
  details?: unknown
): ApiEnvelope<null> {
  return {
    data: null,
    error: {
      errorCode: code,
      code,
      message,
      ...(details !== undefined ? { details } : {}),
    },
  };
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  statusCode = 200
) {
  return reply.status(statusCode).send(successEnvelope(data));
}

export function sendNoContent(reply: FastifyReply) {
  return reply.status(200).send(successEnvelope(null));
}
