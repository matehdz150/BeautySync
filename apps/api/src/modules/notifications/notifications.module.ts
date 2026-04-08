import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSseService } from './notifications-sse.service';
import { NotificationsRealtimeBridge } from './notifications.realtime';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [AuthModule, CacheModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsSseService,
    NotificationsRealtimeBridge,
  ],
})
export class NotificationsModule {}
