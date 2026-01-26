import { Injectable } from '@nestjs/common';
import { BookingsCoreService } from '../booking.core.service';
import { CreateManagerBookingDto } from '../dto/create-booking-manager.dto';

@Injectable()
export class BookingsManagerService {
  constructor(private readonly core: BookingsCoreService) {}

  createManagerBooking(dto: CreateManagerBookingDto) {
    return this.core.createManagerBooking(dto);
  }
}
