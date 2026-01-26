import { Module } from '@nestjs/common';
import { StaffServicesService } from './staff-services.service';
import { StaffServicesController } from './staff-services.controller';

@Module({
  controllers: [StaffServicesController],
  providers: [StaffServicesService],
})
export class StaffServicesModule {}
