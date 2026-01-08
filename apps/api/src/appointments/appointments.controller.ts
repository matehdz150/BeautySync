import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { GetAppointmentsDto } from './dto/get-appointments.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { RescheduleAppointmentDto } from './dto/reschedule-appointment.dto';

@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly service: AppointmentsService) {}

  @Post()
  create(@Body() dto: CreateAppointmentDto) {
    return this.service.create(dto);
  }

  @Get()
  findAll(@Query() query: GetAppointmentsDto) {
    return this.service.findAll(query);
  }

  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() body: UpdateStatusDto) {
    return this.service.updateStatus(id, body);
  }

  @Patch(':id/reschedule')
  reschedule(@Param('id') id: string, @Body() body: RescheduleAppointmentDto) {
    return this.service.reschedule(id, body);
  }
}
