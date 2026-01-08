import { IsEmail, IsUUID, IsIn } from 'class-validator';

export class InviteStaffDto {
  @IsEmail()
  email: string;

  @IsUUID()
  staffId: string;

  @IsIn(['staff', 'manager'])
  role: 'staff' | 'manager';
}
