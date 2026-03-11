import { IsUUID } from 'class-validator';

export class AssignServiceDto {
  @IsUUID()
  staffId: string;

  @IsUUID()
  serviceId: string;
}
