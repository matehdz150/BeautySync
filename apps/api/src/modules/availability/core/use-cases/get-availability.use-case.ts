import { Inject, Injectable } from '@nestjs/common';
import { AVAILABILITY_REPOSITORY } from '../ports/tokens';
import * as availabilityRepository from '../ports/availability.repository';
import { GetAvailabilityDto } from '../../application/dto/create-availability.dto';

@Injectable()
export class GetAvailabilityUseCase {
  constructor(
    @Inject(AVAILABILITY_REPOSITORY)
    private readonly repo: availabilityRepository.AvailabilityRepository,
  ) {}

  execute(query: GetAvailabilityDto) {
    return this.repo.getAvailability(query);
  }
}
