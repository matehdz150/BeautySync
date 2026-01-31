import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { BookingsPublicService } from './booking.public.service';
import { CreatePublicBookingDto } from '../dto/create-booking-public.dto';

import { PublicAuthGuard } from 'src/modules/auth/public/public-auth.guard';
import { PublicUser } from 'src/modules/auth/public/public-user.decorator';

@Controller('public/booking')
export class BookingsPublicController {
  constructor(private readonly publicService: BookingsPublicService) {}

  @UseGuards(PublicAuthGuard)
  @Post('appointments')
  async create(
    @Req() req,
    @Body() dto: CreatePublicBookingDto,
    @PublicUser() session: { publicUserId: string },
  ) {
    const res = await this.publicService.createPublicBooking(
      dto,
      session.publicUserId,
    );

    return {
      ok: true,
      bookingId: res.bookingId,
    };
  }

  @Post(':bookingId/cancel')
  @UseGuards(PublicAuthGuard)
  cancelBooking(
    @Param('bookingId') bookingId: string,
    @PublicUser() session: { publicUserId: string },
  ) {
    return this.publicService.cancelBooking({
      bookingId,
      publicUserId: session.publicUserId,
    });
  }

  @UseGuards(PublicAuthGuard)
  @Get('bookings/:bookingId')
  getPublicBooking(
    @Param('bookingId') bookingId: string,
    @PublicUser() session: { publicUserId: string },
  ) {
    return this.publicService.getPublicBookingById({
      bookingId,
      publicUserId: session.publicUserId,
    });
  }

  @UseGuards(PublicAuthGuard)
  @Post('phone')
  setPhone(
    @PublicUser() session: { publicUserId: string },
    @Body() body: { phoneE164: string },
  ) {
    return this.publicService.setPhone({
      publicUserId: session.publicUserId,
      phoneE164: body.phoneE164,
    });
  }
}
