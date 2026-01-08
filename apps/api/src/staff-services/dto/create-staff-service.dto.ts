/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsUUID } from 'class-validator';

export class LinkStaffServiceDto {
  @IsUUID()
  staffId!: string;

  @IsUUID()
  serviceId!: string;
}
