import type { FastifyReply, FastifyRequest } from 'fastify';

export async function attachIdempotencyKey(
  request: FastifyRequest,
  _reply: FastifyReply
): Promise<void> {
  try {
    const raw = request.headers['idempotency-key'];
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (typeof value !== 'string') {
      return;
    }
    const normalized = value.trim();
    if (!normalized) {
      return;
    }
    request.idempotencyKey = normalized.slice(0, 255);
  } catch (err) {
    console.error('MIDDLEWARE ERROR:', err);
    throw err;
  }
}
