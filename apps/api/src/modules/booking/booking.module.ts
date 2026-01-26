import { Module } from '@nestjs/common';
import { BookingsPublicService } from './public/booking.public.service';
import { BookingsPublicController } from './public/booking.public.controller';
import { BookingsCoreService } from './booking.core.service';
import { PublicBookingJobsService } from '../queues/booking/public-booking-job.service';
import { PublicAuthModule } from '../auth/public/public-auth.module';
import { DbModule } from '../db/db.module';
import { BookingsManagerController } from './manager/booking.manager.controller';
import { BookingsManagerService } from './manager/booking.manager.service';

@Module({
  imports: [PublicAuthModule, DbModule],
  controllers: [BookingsPublicController, BookingsManagerController],
  providers: [
    BookingsPublicService,
    BookingsCoreService,
    PublicBookingJobsService,
    BookingsManagerService,
  ],
  exports: [BookingsCoreService],
})
export class BookingModule {}
