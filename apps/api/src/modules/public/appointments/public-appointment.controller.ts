import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { PublicAppointmentsService } from './public-appointments.service';
import { GetMyPublicAppointmentsQueryDto } from '../dto/get-my-appointments.dto';
import { PublicUser } from 'src/modules/auth/public/public-user.decorator';
import { PublicAuthGuard } from 'src/modules/auth/public/public-auth.guard';

@Controller('public/appointments')
export class PublicAppointmentController {
  constructor(private readonly service: PublicAppointmentsService) {}

  @UseGuards(PublicAuthGuard)
  @Get('me')
  async getMyBookings(
    @PublicUser() session: { publicUserId: string },
    @Query() query: GetMyPublicAppointmentsQueryDto,
  ) {
    return this.service.getMyBookings({
      publicUserId: session.publicUserId,
      query,
    });
  }

  @UseGuards(PublicAuthGuard)
  @Get('bookings/:bookingId')
  getMyBookingById(
    @PublicUser() session: { publicUserId: string },
    @Param('bookingId') bookingId: string,
  ) {
    return this.service.getMyBookingById({
      bookingId,
      publicUserId: session.publicUserId,
    });
  }
}
