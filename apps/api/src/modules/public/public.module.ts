import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { AvailabilityModule } from 'src/modules/availability/availability.module';
import { PublicAppointmentController } from './appointments/public-appointment.controller';
import { PublicAppointmentsService } from './appointments/public-appointments.service';
import { PublicBookingJobsService } from 'src/modules/queues/booking/public-booking-job.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AvailabilityModule, AuthModule],
  controllers: [PublicController, PublicAppointmentController],
  providers: [
    PublicService,
    PublicAppointmentsService,
    PublicBookingJobsService,
  ],
})
export class PublicModule {}
