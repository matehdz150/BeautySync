import { Global, Module } from '@nestjs/common';
import { redis } from './redis.provider';

@Global()
@Module({
  providers: [
    {
      provide: 'REDIS',
      useValue: redis,
    },
  ],
  exports: ['REDIS'],
})
export class RedisModule {}
