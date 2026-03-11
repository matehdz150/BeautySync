import { Inject, Injectable } from '@nestjs/common';
import { SERVICE_REPOSITORY } from '../ports/tokens';
import * as serviceRepository from '../ports/service.repository';

@Injectable()
export class AddServiceNoteUseCase {
  constructor(
    @Inject(SERVICE_REPOSITORY)
    private repo: serviceRepository.ServiceRepository,
  ) {}

  execute(serviceId: string, text: string) {
    return this.repo.addNote(serviceId, text);
  }
}
