import { Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_REPOSITORY } from '../ports/tokens';
import * as availabilityRepository from '../ports/availability.repository';
import { GetAvailabilityForSlotDto } from '../../application/dto/get-availability-for-slot.dto';

@Injectable()
export class GetAvailableServicesForSlotUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly repo: availabilityRepository.AvailabilityRepository,
  ) {}

  execute(query: GetAvailabilityForSlotDto) {
    return this.repo.getAvailableServicesForSlot(query);
  }
}
