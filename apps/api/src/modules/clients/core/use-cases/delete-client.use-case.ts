import { Inject, Injectable } from '@nestjs/common';
import { CLIENTS_REPOSITORY } from '../ports/tokens';
import * as clientsRepository from '../ports/clients.repository';

@Injectable()
export class DeleteClientUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repo: clientsRepository.ClientsRepository,
  ) {}

  execute(id: string) {
    return this.repo.delete(id);
  }
}
