import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffTimeOffDto } from './create-staff-time-off.dto';

export class UpdateStaffTimeOffDto extends PartialType(CreateStaffTimeOffDto) {}
