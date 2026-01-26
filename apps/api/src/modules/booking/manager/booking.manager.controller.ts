import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/manager/guards/roles.guard';
import { BookingsManagerService } from './booking.manager.service';
import { CreateManagerBookingDto } from '../dto/create-booking-manager.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('manager/booking')
export class BookingsManagerController {
  constructor(private readonly service: BookingsManagerService) {}

  // POST /manager/booking/appointments
  @Post('appointments')
  async create(@Body() dto: CreateManagerBookingDto) {
    const res = await this.service.createManagerBooking(dto);

    return {
      ok: true,
      publicBookingId: res.publicBookingId ?? null,
      publicUserId: res.publicUserId ?? null,
      clientId: res.clientId ?? null,
      appointmentIds: res.appointments.map((a) => a.id),
    };
  }
}
