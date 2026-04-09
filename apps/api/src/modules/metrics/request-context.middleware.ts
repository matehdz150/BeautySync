import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { requestContext } from './request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    const requestId = randomUUID();

    requestContext.run(
      {
        requestId,
        queryCount: 0,
        actions: new Map(),
        cache: new Map(),
      },
      () => next(),
    );
  }
}
