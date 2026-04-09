import { Injectable } from '@nestjs/common';
import { BookingsCoreService } from '../booking.core.service';
import { CreateManagerBookingDto } from '../dto/create-booking-manager.dto';
import {
  ManagerChainBuildDto,
  ManagerChainNextServicesDto,
  ManagerChainNextStaffOptionsDto,
} from '../dto/manager-chain.dto';
import { BookingRescheduleReason } from 'src/modules/db/schema';
import { metricsStore } from 'src/modules/metrics/metrics.store';
import { trackAction } from 'src/modules/metrics/action-metrics';

@Injectable()
export class BookingsManagerService {
  constructor(private readonly core: BookingsCoreService) {}

  async createManagerBooking(dto: CreateManagerBookingDto) {
    const result = await trackAction('CREATE_BOOKING', () =>
      this.core.createManagerBooking(dto),
    );
    metricsStore.recordBooking();
    return result;
  }

  assignClientToBooking(params: { bookingId: string; clientId: string }) {
    return this.core.assignClientToBooking(params);
  }

  getManagerBookingById(params: { bookingId: string }) {
    return this.core.getManagerBookingById(params);
  }

  chainNextServices(dto: ManagerChainNextServicesDto) {
    return this.core.managerChainNextServices(dto);
  }

  chainNextStaffOptions(dto: ManagerChainNextStaffOptionsDto) {
    return this.core.managerChainNextStaffOptions(dto);
  }

  chainBuild(dto: ManagerChainBuildDto) {
    return this.core.managerChainBuild(dto);
  }

  cancelBooking(params: { bookingId: string; reason?: string }) {
    const { bookingId, reason } = params;

    return this.core.cancelBooking({
      bookingId,
      cancelledBy: 'MANAGER',
      reason,
    });
  }

  rescheduleBooking(params: {
    bookingId: string;
    newStartIso: string;
    reason?: BookingRescheduleReason;
    notes?: string;
  }) {
    const { bookingId, newStartIso, reason, notes } = params;

    return this.core.rescheduleBookingCore({
      bookingId,
      newStartIso,
      rescheduledBy: 'MANAGER',
      reason: reason ?? 'ADMIN',
      notes,
    });
  }
}
