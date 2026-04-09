import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSseService } from './notifications-sse.service';
import { NotificationsRealtimeBridge } from './notifications.realtime';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { NotificationsCacheService } from './notifications-cache.service';
import { NotificationsRepository } from './notifications.repository';

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsSseService,
    NotificationsRealtimeBridge,
    NotificationsCacheService,
    NotificationsRepository,
  ],
})
export class NotificationsModule {}
