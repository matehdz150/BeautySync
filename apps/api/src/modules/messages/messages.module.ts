import { Module } from '@nestjs/common';
import { DbModule } from '../db/db.module';
import { RedisModule } from '../queues/redis/redis.module';

// CORE
import { ChatService } from './core/chat.service';
import { ChatEventBus } from './core/chat.event-bus';
import { ChatSseService } from './core/ChatSse.service';

// INFRA
import { ChatRealtimeBridge } from './infrastructure/chat-realtime.bridge';

// MANAGER
import { ChatManagerController } from './manager/chat-manager.controller';
import { ChatConversationSseController } from './manager/chat-manager-conversation-sse.controller';

// PUBLIC
import { ChatPublicController } from './public/chat-public.controller';
import { ChatPublicSseController } from './public/chat-public-sse.controller';
import { DrizzleChatRepository } from './infrastructure/drizzle/chat.drizzle.repository';
import { AuthModule } from '../auth/manager/auth.module';
import { PublicAuthModule } from '../auth/public/public-auth.module';
import { CHAT_REPOSITORY } from './core/chat.repository';

@Module({
  imports: [DbModule, RedisModule, AuthModule, PublicAuthModule],

  controllers: [
    // manager
    ChatManagerController,
    ChatConversationSseController,

    // public
    ChatPublicController,
    ChatPublicSseController,
  ],

  providers: [
    // CORE SINGLETONS
    ChatService,
    ChatEventBus,
    ChatSseService,
    {
      provide: CHAT_REPOSITORY,
      useClass: DrizzleChatRepository,
    },

    // REALTIME BRIDGE (redis → sse)
    ChatRealtimeBridge,
  ],

  exports: [
    // exportamos solo lo necesario para otros módulos
    ChatService,
  ],
})
export class MessagesModule {}
