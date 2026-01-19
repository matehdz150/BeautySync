import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { StaffSchedulesService } from './staff-schedules.service';
import { CreateStaffScheduleDto } from './dto/create-staff-schedule.dto';
import { UpdateStaffScheduleDto } from './dto/update-staff-schedule.dto';

@Controller('staff-schedules')
export class StaffSchedulesController {
  constructor(private readonly service: StaffSchedulesService) {}

  @Get('staff/:staffId')
  findForStaff(@Param('staffId') staffId: string) {
    return this.service.findForStaff(staffId);
  }

  @Post()
  create(@Body() dto: CreateStaffScheduleDto) {
    return this.service.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateStaffScheduleDto) {
    return this.service.update(Number(id), dto);
  }

  @Delete('staff/:staffId')
  async clearStaffSchedules(@Param('staffId') staffId: string) {
    return this.service.clearForStaff(staffId);
  }
}
