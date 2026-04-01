import { Global, Module } from '@nestjs/common';
import { DomainEventBus } from './domain-event-bus';

@Global() // 🔥 opcional pero recomendado
@Module({
  providers: [DomainEventBus],
  exports: [DomainEventBus],
})
export class DomainEventsModule {}
