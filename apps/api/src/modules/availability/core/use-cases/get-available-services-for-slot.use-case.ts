import { Injectable } from '@nestjs/common';
import { GetAvailabilityForSlotDto } from '../../application/dto/get-availability-for-slot.dto';
import { GetAvailableServicesForSlotFromSnapshotUseCase } from './get-available-services-for-slot-from-snapshot.use-case';

@Injectable()
export class GetAvailableServicesForSlotUseCase {
  constructor(
    private readonly getAvailableServicesForSlotFromSnapshot: GetAvailableServicesForSlotFromSnapshotUseCase,
  ) {}

  execute(query: GetAvailabilityForSlotDto) {
    return this.getAvailableServicesForSlotFromSnapshot.execute(query);
  }
}
