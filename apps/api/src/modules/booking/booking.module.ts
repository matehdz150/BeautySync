import { Module } from '@nestjs/common';
import { BookingsPublicService } from './public/booking.public.service';
import { BookingsPublicController } from './public/booking.public.controller';
import { BookingsCoreService } from './booking.core.service';
import { PublicBookingJobsService } from '../queues/booking/public-booking-job.service';
import { DbModule } from '../db/db.module';
import { BookingsManagerController } from './manager/booking.manager.controller';
import { BookingsManagerService } from './manager/booking.manager.service';
import { NotificationsJobsService } from '../queues/notifications/notifications-job.service';
import { AuthModule } from '../auth/auth.module';
import { CacheModule } from '../cache/cache.module';
import { CouponsModule } from '../cupons/cupons.module';
import { DomainEventsModule } from 'src/shared/domain-events/domain-events.module';
import { CalendarModule } from '../calendar/calendar.module';
import { AvailabilityModule } from '../availability/availability.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    AuthModule,
    DbModule,
    CacheModule,
    CouponsModule,
    DomainEventsModule,
    CalendarModule,
    AvailabilityModule,
    PaymentsModule,
  ],
  controllers: [BookingsPublicController, BookingsManagerController],
  providers: [
    BookingsPublicService,
    BookingsCoreService,
    PublicBookingJobsService,
    BookingsManagerService,
    NotificationsJobsService,
  ],
  exports: [BookingsCoreService],
})
export class BookingModule {}
