import { PartialType } from '@nestjs/mapped-types';
import { CreateStaffScheduleDto } from './create-staff-schedule.dto';

export class UpdateStaffScheduleDto extends PartialType(CreateStaffScheduleDto) {}
