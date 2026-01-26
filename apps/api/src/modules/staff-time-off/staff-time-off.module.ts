import { Module } from '@nestjs/common';
import { StaffTimeOffService } from './staff-time-off.service';
import { StaffTimeOffController } from './staff-time-off.controller';

@Module({
  controllers: [StaffTimeOffController],
  providers: [StaffTimeOffService],
})
export class StaffTimeOffModule {}
