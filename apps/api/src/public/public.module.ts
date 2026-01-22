import { Module } from '@nestjs/common';
import { PublicService } from './public.service';
import { PublicController } from './public.controller';
import { AvailabilityModule } from 'src/availability/availability.module';
import { PublicAuthModule } from './auth/public-auth.module';
import { PublicAppointmentController } from './appointments/public-appointment.controller';
import { PublicAppointmentsService } from './appointments/public-appointments.service';
import { PublicBookingJobsService } from 'src/queues/booking/public-booking-job.service';

@Module({
  imports: [AvailabilityModule, PublicAuthModule],
  controllers: [PublicController, PublicAppointmentController],
  providers: [
    PublicService,
    PublicAppointmentsService,
    PublicBookingJobsService,
  ],
})
export class PublicModule {}
