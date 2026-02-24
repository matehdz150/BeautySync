import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { ChatEventBus } from '../core/chat.event-bus';
import { ChatSseService } from '../core/ChatSse.service';
import { ChatEvent } from '../core/chat.events';
import { NotificationsJobsService } from 'src/modules/queues/notifications/notifications-job.service';
import { redis } from 'src/modules/queues/redis/redis.provider';
import { CHAT_REPOSITORY } from '../core/chat.repository';
import { DrizzleChatRepository } from './drizzle/chat.drizzle.repository';

@Injectable()
export class ChatRealtimeBridge implements OnModuleInit {
  constructor(
    private readonly events: ChatEventBus,
    private readonly chatSse: ChatSseService,
    private readonly notifications: NotificationsJobsService,
    @Inject(CHAT_REPOSITORY)
    private readonly repo: DrizzleChatRepository,
  ) {}

  onModuleInit() {
    this.events.subscribe((event) => {
      void this.handle(event);
    });
  }

  private async handle(event: ChatEvent): Promise<void> {
    switch (event.type) {
      case 'MESSAGE_SENT': {
        // 🔹 Realtime conversación
        this.chatSse.emit(event.conversationId, 'chat.message', event);

        // 🔹 Realtime inbox branch
        const branchKey = `branch:${event.branchId}`;
        this.chatSse.emit(branchKey, 'chat.message', event);

        // ===============================
        // 🔔 NOTIFICATION + DEBOUNCE
        // ===============================

        const isManagerConnected = this.chatSse.isActive(branchKey);

        if (!isManagerConnected && event.actor.type === 'CLIENT') {
          const debounceKey = `chat:notify:${event.conversationId}`;

          const wasSet = await redis.set(debounceKey, '1', 'EX', 10, 'NX');

          if (wasSet) {
            const client = await this.repo.getClientBasic(event.actor.clientId);

            await this.notifications.chatMessage({
              conversationId: event.conversationId,
              bookingId: event.bookingId,
              branchId: event.branchId,
              preview: event.preview,
              actor: {
                type: 'CLIENT',
                id: event.actor.clientId,
              },
              senderName: client?.name ?? 'Cliente',
              senderAvatar: client?.avatarUrl ?? null,
            });
          }
        }

        break;
      }

      case 'CONVERSATION_CREATED':
        this.chatSse.emit(event.conversationId, 'chat.conversation', event);
        break;

      case 'CONVERSATION_READ':
        this.chatSse.emit(event.conversationId, 'chat.read', event);
        break;
    }
  }
}
