import { Module } from '@nestjs/common';
import { AvailabilityModule } from 'src/availability/availability.module';

import { AvailabilityChainCoreService } from './availability-chain-core.service';
import { AvailabilityChainPublicService } from './availability-chain-public.service';
import { AvailabilityChainManagerService } from './availability-chain-manager.service';
import { AvailabilityChainController } from './availability-chain.controller';

@Module({
  imports: [AvailabilityModule],
  controllers: [AvailabilityChainController],
  providers: [
    AvailabilityChainCoreService,
    AvailabilityChainPublicService,
    AvailabilityChainManagerService,
  ],
})
export class AvailabilityChainModule {}
