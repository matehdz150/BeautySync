import { Inject, Injectable } from '@nestjs/common';
import { CLIENTS_REPOSITORY } from '../ports/tokens';
import * as clientsRepository from '../ports/clients.repository';

@Injectable()
export class CreateClientUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repo: clientsRepository.ClientsRepository,
  ) {}

  execute(dto: clientsRepository.CreateClientInput) {
    return this.repo.create(dto);
  }
}
