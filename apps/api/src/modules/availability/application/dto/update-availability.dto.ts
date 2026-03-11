import { PartialType } from '@nestjs/mapped-types';
import { GetAvailabilityDto } from './create-availability.dto';

export class UpdateAvailabilityDto extends PartialType(GetAvailabilityDto) {}
