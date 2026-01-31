import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { JwtAuthGuard } from 'src/modules/auth/manager/guards/jwt-auth.guard';
import { RolesGuard } from 'src/modules/auth/manager/guards/roles.guard';
import { BookingsManagerService } from './booking.manager.service';
import { CreateManagerBookingDto } from '../dto/create-booking-manager.dto';
import * as managerChainDto from '../dto/manager-chain.dto';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('manager/booking')
export class BookingsManagerController {
  constructor(private readonly service: BookingsManagerService) {}

  @Get(':bookingId')
  getManagerBookingById(@Param('bookingId') bookingId: string) {
    return this.service.getManagerBookingById({ bookingId });
  }

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

  @Post(':bookingId/cancel')
  async cancelBooking(
    @Param('bookingId') bookingId: string,
    @Body() body: { reason?: string },
  ) {
    return this.service.cancelBooking({
      bookingId,
      reason: body?.reason,
    });
  }

  @Post(':bookingId/assign-client')
  async assignClientToBooking(
    @Param('bookingId') bookingId: string,
    @Body() body: { clientId: string },
  ) {
    return this.service.assignClientToBooking({
      bookingId,
      clientId: body.clientId,
    });
  }

  @Post('chain/next-services')
  async chainNextServices(
    @Body() dto: managerChainDto.ManagerChainNextServicesDto,
  ) {
    return this.service.chainNextServices(dto);
  }

  // ✅ NUEVO: POST /manager/booking/chain/next-staff-options
  @Post('chain/next-staff-options')
  async chainNextStaffOptions(
    @Body() dto: managerChainDto.ManagerChainNextStaffOptionsDto,
  ) {
    return this.service.chainNextStaffOptions(dto);
  }

  // ✅ NUEVO: POST /manager/booking/chain/build
  @Post('chain/build')
  async chainBuild(@Body() dto: managerChainDto.ManagerChainBuildDto) {
    return this.service.chainBuild(dto);
  }
}
