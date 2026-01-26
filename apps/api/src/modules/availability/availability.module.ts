import { Module } from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { AvailabilityController } from './manager/availability.controller';
import { AvailabilityPublicService } from './public/availability.public.service';
import { AvailabilityPublicController } from './public/availability.public.controller';
import { AvailabilityCoreService } from './availability-chain.service';
import { AvailabilityManagerService } from './manager/availability.manager.service';

@Module({
  controllers: [AvailabilityController, AvailabilityPublicController],
  providers: [
    AvailabilityService,
    AvailabilityPublicService,
    AvailabilityCoreService,
    AvailabilityManagerService,
  ],
  exports: [AvailabilityService, AvailabilityPublicService],
})
export class AvailabilityModule {}
