import { Injectable } from '@nestjs/common';
import { AvailableServicesAtDto } from '../../application/dto/get-availability-for-slot.dto';
import { GetAvailabilityAtUseCase } from './get-availability-at.use-case';

@Injectable()
export class GetAvailableServicesAtUseCase {
  constructor(private readonly getAvailabilityAt: GetAvailabilityAtUseCase) {}

  async execute(dto: AvailableServicesAtDto) {
    return this.getAvailabilityAt.execute(dto);
  }
}
