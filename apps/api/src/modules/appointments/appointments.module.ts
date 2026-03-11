import { Module } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { AppointmentsController } from './appointments.controller';
import { AvailabilityModule } from 'src/modules/availability/availability.module';
import { CacheModule } from '../cache/cache.module';

@Module({
  imports: [AvailabilityModule, CacheModule],
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppointmentsModule {}
