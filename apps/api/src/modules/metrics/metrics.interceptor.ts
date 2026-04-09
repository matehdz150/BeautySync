/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';
import type { Request, Response } from 'express';
import { logMetric } from './structured-metrics.logger';
import { requestContext } from './request-context';
import { metricsStore } from './metrics.store';

function toChunkSize(chunk: unknown): number {
  if (typeof chunk === 'string') {
    return Buffer.byteLength(chunk);
  }

  if (Buffer.isBuffer(chunk)) {
    return chunk.length;
  }

  if (chunk === undefined || chunk === null) {
    return 0;
  }

  return Buffer.byteLength(JSON.stringify(chunk));
}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const startedAt = process.hrtime.bigint();

    const httpCtx = context.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    let responseSize = 0;

    const originalWrite = res.write.bind(res);
    const originalEnd = res.end.bind(res);

    res.write = ((chunk: unknown, ...args: unknown[]) => {
      responseSize += toChunkSize(chunk);
      return originalWrite(chunk as any, ...(args as any));
    }) as Response['write'];

    res.end = ((chunk?: unknown, ...args: unknown[]) => {
      responseSize += toChunkSize(chunk);
      return originalEnd(chunk as any, ...(args as any));
    }) as Response['end'];

    return next.handle().pipe(
      finalize(() => {
        const durationMs =
          Number(process.hrtime.bigint() - startedAt) / 1_000_000;
        const routePath =
          req.route?.path && req.baseUrl
            ? `${req.baseUrl}${req.route.path}`
            : (req.route?.path ?? req.originalUrl.split('?')[0] ?? req.url);

        const roundedDuration = Number(durationMs.toFixed(2));

        metricsStore.recordHttpMetric(routePath, roundedDuration);

        logMetric({
          type: 'http_metric',
          route: routePath,
          method: req.method,
          duration: roundedDuration,
          status: res.statusCode,
          responseSize,
          requestId: requestContext.getRequestId() ?? null,
        });

        const ctx = requestContext.get();
        if (ctx) {
          logMetric({
            type: 'db_summary',
            requestId: ctx.requestId,
            queryCount: ctx.queryCount,
          });
        }
      }),
    );
  }
}
