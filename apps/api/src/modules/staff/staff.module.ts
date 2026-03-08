import { Module } from '@nestjs/common';
import { StaffService } from './staff.service';
import { StaffController } from './staff.controller';
import { AuthModule } from '../auth/auth.module';

@Module({
  controllers: [StaffController],
  providers: [StaffService],
  imports: [AuthModule],
})
export class StaffModule {}
