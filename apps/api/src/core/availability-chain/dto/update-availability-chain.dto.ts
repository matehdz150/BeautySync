import { PartialType } from '@nestjs/mapped-types';
import { CreateAvailabilityChainDto } from './create-availability-chain.dto';

export class UpdateAvailabilityChainDto extends PartialType(CreateAvailabilityChainDto) {}
