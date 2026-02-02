import { Injectable, NotFoundException } from '@nestjs/common';
import type { CreatePublicBookingDto } from '../dto/create-booking-public.dto';
import { BookingsCoreService } from '../booking.core.service';

@Injectable()
export class BookingsPublicService {
  constructor(private readonly core: BookingsCoreService) {}

  async createPublicBooking(dto: CreatePublicBookingDto, publicUserId: string) {
    const res = await this.core.createPublicBooking(dto, publicUserId);

    return {
      ok: true,
      bookingId: res.bookingId,
    };
  }

  getPublicBookingById(params: { bookingId: string; publicUserId: string }) {
    return this.core.getPublicBookingById(params);
  }

  setPhone(params: { publicUserId: string; phoneE164: string }) {
    return this.core.setPhone(params);
  }

  async cancelBooking(params: { bookingId: string; publicUserId: string }) {
    const { bookingId, publicUserId } = params;

    // 🔐 Ownership check (source of truth)
    const booking = await this.core.getPublicBookingById({
      bookingId,
      publicUserId,
    });

    if (!booking?.ok) {
      // defensivo
      throw new NotFoundException('Booking not found');
    }

    // ✅ ahora sí cancelar
    return this.core.cancelBooking({
      bookingId,
      cancelledBy: 'PUBLIC',
    });
  }

  async rescheduleBooking(params: {
    bookingId: string;
    newStartIso: string;
    publicUserId: string;
    notes?: string;
  }) {
    const { bookingId, newStartIso, publicUserId, notes } = params;

    return this.core.rescheduleBookingCore({
      bookingId,
      newStartIso,
      rescheduledBy: 'PUBLIC',
      publicUserId,
      reason: 'CLIENT_REQUEST',
      notes,
    });
  }
}
