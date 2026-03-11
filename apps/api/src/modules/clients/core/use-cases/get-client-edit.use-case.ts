import { Inject, Injectable } from '@nestjs/common';
import { CLIENTS_REPOSITORY } from '../ports/tokens';
import * as clientsRepository from '../ports/clients.repository';
import { ClientEditData } from '../entities/client.entity';

@Injectable()
export class GetClientEditUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repo: clientsRepository.ClientsRepository,
  ) {}

  execute(id: string): Promise<ClientEditData> {
    return this.repo.findEditData(id);
  }
}
