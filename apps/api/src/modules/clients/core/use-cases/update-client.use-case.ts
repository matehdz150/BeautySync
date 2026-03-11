import { ForbiddenException, Inject, Injectable } from '@nestjs/common';
import { CLIENTS_REPOSITORY } from '../ports/tokens';
import * as clientsRepository from '../ports/clients.repository';

@Injectable()
export class UpdateClientUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repo: clientsRepository.ClientsRepository,
  ) {}

  async execute(id: string, dto: clientsRepository.UpdateClientInput) {
    const client = await this.repo.findEditData(id);

    if (!client.editable.name && dto.name !== undefined) {
      throw new ForbiddenException(
        'Client linked to a user. Name cannot be edited.',
      );
    }

    if (!client.editable.email && dto.email !== undefined) {
      throw new ForbiddenException(
        'Client linked to a user. Email cannot be edited.',
      );
    }

    if (!client.editable.phone && dto.phone !== undefined) {
      throw new ForbiddenException(
        'Client linked to a user. Phone cannot be edited.',
      );
    }

    return this.repo.update(id, dto);
  }
}
