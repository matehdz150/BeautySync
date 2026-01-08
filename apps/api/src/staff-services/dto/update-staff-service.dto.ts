import { PartialType } from '@nestjs/mapped-types';
import { LinkStaffServiceDto } from './create-staff-service.dto';

export class UpdateStaffServiceDto extends PartialType(LinkStaffServiceDto) {}
