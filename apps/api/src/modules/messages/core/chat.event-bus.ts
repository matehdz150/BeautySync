import { ChatEvent } from './chat.events';

export type ChatEventHandler = (event: ChatEvent) => void;

export class ChatEventBus {
  private handlers: ChatEventHandler[] = [];

  subscribe(handler: ChatEventHandler) {
    console.log('PUBLISH PID', process.pid);
    this.handlers.push(handler);
  }

  publish(event: ChatEvent) {
    for (const handler of this.handlers) {
      handler(event);
    }
  }
}
