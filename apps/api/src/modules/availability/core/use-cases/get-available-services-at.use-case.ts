import { Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_REPOSITORY } from '../ports/tokens';
import * as availabilityRepository from '../ports/availability.repository';
import { AvailableServicesAtDto } from '../../application/dto/get-availability-for-slot.dto';

@Injectable()
export class GetAvailableServicesAtUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly repo: availabilityRepository.AvailabilityRepository,
  ) {}

  async execute(dto: AvailableServicesAtDto) {
    const services = await this.repo.getAvailableServicesAt(dto);

    return {
      ok: true,
      services,
    };
  }
}
