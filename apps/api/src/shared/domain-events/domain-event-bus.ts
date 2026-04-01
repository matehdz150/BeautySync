import { Injectable } from '@nestjs/common';

type EventHandler<T = any> = (event: T) => Promise<void>;

@Injectable()
export class DomainEventBus {
  private handlers: Record<string, EventHandler[]> = {};

  register<T>(eventType: string, handler: EventHandler<T>) {
    if (!this.handlers[eventType]) {
      this.handlers[eventType] = [];
    }

    this.handlers[eventType].push(handler);
  }

  async publish<T>(event: { type: string; payload: T }) {
    const handlers = this.handlers[event.type] || [];

    for (const handler of handlers) {
      await handler(event);
    }
  }
}
