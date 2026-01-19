import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PublicService } from './public.service';
import { CreatePublicBookingDto } from './dto/create-booking-public.dto';
import { PublicAuthGuard } from './auth/public-auth.guard';
import { PublicUser } from './auth/public-user.decorator';

@Controller('public/branches')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  // 1️⃣ Servicios
  @Get(':slug/services')
  getPublicServices(@Param('slug') slug: string) {
    return this.publicService.getServicesByBranchSlug(slug);
  }

  // 2️⃣ Staff por servicio
  @Get(':slug/services/:serviceId/staff')
  getStaffForService(
    @Param('slug') slug: string,
    @Param('serviceId') serviceId: string,
  ) {
    return this.publicService.getStaffForService({ slug, serviceId });
  }

  // 3️⃣ Fechas disponibles
  @Get(':slug/availability/dates')
  getAvailableDates(
    @Param('slug') slug: string,
    @Query('requiredDurationMin') requiredDurationMin: string,
    @Query('staffId') staffId?: string,
    @Query('month') month?: string,
  ) {
    return this.publicService.getAvailableDates({
      slug,
      requiredDurationMin: Number(requiredDurationMin),
      staffId,
      month,
    });
  }

  // 4️⃣ Horas disponibles
  @Get(':slug/availability/times')
  getAvailableTimes(
    @Param('slug') slug: string,

    @Query('date') date: string,

    // legacy
    @Query('serviceId') serviceId?: string,

    // nuevo
    @Query('requiredDurationMin') requiredDurationMin?: string,

    @Query('staffId') staffId?: string,
  ) {
    return this.publicService.getAvailableTimes({
      slug,
      date,
      staffId,

      serviceId: serviceId || undefined,

      requiredDurationMin:
        typeof requiredDurationMin === 'string'
          ? Number(requiredDurationMin)
          : undefined,
    });
  }

  @Post(':slug/availability/chain')
  getAvailableTimesChain(
    @Param('slug') slug: string,
    @Body()
    body: {
      date: string;
      chain: { serviceId: string; staffId: string }[];
    },
  ) {
    return this.publicService.getAvailableTimesChain({
      slug,
      date: body.date,
      chain: body.chain,
    });
  }

  @UseGuards(PublicAuthGuard)
  @Post('appointments')
  async create(
    @Body() dto: CreatePublicBookingDto,
    @PublicUser() session: { publicUserId: string },
  ) {
    return this.publicService.createPublicBooking(dto, session.publicUserId);
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
