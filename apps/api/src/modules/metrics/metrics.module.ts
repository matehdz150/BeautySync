import { Global, Module } from '@nestjs/common';
import { MetricsInterceptor } from './metrics.interceptor';
import { RequestContextMiddleware } from './request-context.middleware';

@Global()
@Module({
  providers: [MetricsInterceptor, RequestContextMiddleware],
  exports: [MetricsInterceptor, RequestContextMiddleware],
})
export class MetricsModule {}
