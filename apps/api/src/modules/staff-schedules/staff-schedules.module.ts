import { Module } from '@nestjs/common';
import { StaffSchedulesService } from './staff-schedules.service';
import { StaffSchedulesController } from './staff-schedules.controller';
import { AvailabilityModule } from '../availability/availability.module';

@Module({
  imports: [AvailabilityModule],
  controllers: [StaffSchedulesController],
  providers: [StaffSchedulesService],
})
export class StaffSchedulesModule {}
