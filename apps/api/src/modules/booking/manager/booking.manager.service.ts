import { Injectable } from '@nestjs/common';
import { BookingsCoreService } from '../booking.core.service';
import { CreateManagerBookingDto } from '../dto/create-booking-manager.dto';
import {
  ManagerChainBuildDto,
  ManagerChainNextServicesDto,
  ManagerChainNextStaffOptionsDto,
} from '../dto/manager-chain.dto';

@Injectable()
export class BookingsManagerService {
  constructor(private readonly core: BookingsCoreService) {}

  createManagerBooking(dto: CreateManagerBookingDto) {
    return this.core.createManagerBooking(dto);
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
}
