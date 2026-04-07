import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

const requestStartTime = Symbol('requestStartTime');

type RequestWithStart = FastifyRequest & {
  [requestStartTime]?: bigint;
};

export function registerRequestLogger(app: FastifyInstance): void {
  app.addHook('onRequest', async (request) => {
    const req = request as RequestWithStart;
    req[requestStartTime] = process.hrtime.bigint();

    request.log.info(
      {
        requestId: request.id,
        method: request.method,
        url: request.url,
        ip: request.ip,
      },
      'Request started'
    );
  });

  app.addHook('onResponse', async (request: FastifyRequest, reply: FastifyReply) => {
    const req = request as RequestWithStart;
    const startedAt = req[requestStartTime];
    const durationMs =
      startedAt !== undefined
        ? Number(process.hrtime.bigint() - startedAt) / 1_000_000
        : undefined;

    const payload = {
      requestId: request.id,
      method: request.method,
      url: request.url,
      statusCode: reply.statusCode,
      durationMs: durationMs !== undefined ? Math.round(durationMs * 100) / 100 : undefined,
      ip: request.ip,
      userAgent: request.headers['user-agent'],
    };

    if (reply.statusCode >= 500) {
      request.log.error(payload, 'Request failed');
      return;
    }

    if (reply.statusCode >= 400) {
      request.log.warn(payload, 'Request completed with client error');
      return;
    }

    request.log.info(payload, 'Request completed');
  });
}
