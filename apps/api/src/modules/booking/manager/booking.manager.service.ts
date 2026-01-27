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

  chainNextServices(dto: ManagerChainNextServicesDto) {
    return this.core.managerChainNextServices(dto);
  }

  chainNextStaffOptions(dto: ManagerChainNextStaffOptionsDto) {
    return this.core.managerChainNextStaffOptions(dto);
  }

  chainBuild(dto: ManagerChainBuildDto) {
    return this.core.managerChainBuild(dto);
  }
}
