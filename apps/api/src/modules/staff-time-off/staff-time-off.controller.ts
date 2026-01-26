import { Body, Controller, Delete, Get, Param, Post } from '@nestjs/common';
import { StaffTimeOffService } from './staff-time-off.service';
import { CreateStaffTimeOffDto } from './dto/create-staff-time-off.dto';

@Controller('staff-time-off')
export class StaffTimeOffController {
  constructor(private readonly service: StaffTimeOffService) {}

  @Get(':staffId')
  findForStaff(@Param('staffId') staffId: string) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.service.findForStaff(staffId);
  }

  @Post()
  create(@Body() dto: CreateStaffTimeOffDto) {
    return this.service.create(dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(Number(id));
  }
}
