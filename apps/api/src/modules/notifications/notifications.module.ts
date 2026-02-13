import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsSseService } from './notifications-sse.service';
import { NotificationsRealtimeBridge } from './notifications.realtime';

@Module({
  imports: [],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    NotificationsSseService,
    NotificationsRealtimeBridge,
  ],
})
export class NotificationsModule {}
