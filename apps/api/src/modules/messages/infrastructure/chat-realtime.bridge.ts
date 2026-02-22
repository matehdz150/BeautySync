/* eslint-disable @typescript-eslint/no-unsafe-argument */
import { Injectable, OnModuleInit } from '@nestjs/common';
import { ChatEventBus } from '../core/chat.event-bus';
import { ChatSseService } from '../core/ChatSse.service';
import { ChatEvent } from '../core/chat.events';

@Injectable()
export class ChatRealtimeBridge implements OnModuleInit {
  constructor(
    private readonly events: ChatEventBus,
    private readonly chatSse: ChatSseService,
  ) {}

  onModuleInit() {
    this.events.subscribe(this.handle.bind(this));
  }

  private handle(event: ChatEvent) {
    switch (event.type) {
      case 'MESSAGE_SENT':
        // 🔹 emitir a la conversación (chat abierto)
        this.chatSse.emit(event.conversationId, 'chat.message', event);

        // 🔹 emitir al branch (para inbox)
        this.chatSse.emit(`branch:${event.branchId}`, 'chat.message', event);
        break;

      case 'CONVERSATION_CREATED':
        this.chatSse.emit(event.conversationId, 'chat.conversation', event);
        break;

      case 'CONVERSATION_READ':
        this.chatSse.emit(event.conversationId, 'chat.read', event);
        break;
    }
  }
}
