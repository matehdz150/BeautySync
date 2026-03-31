import { Inject, Injectable } from '@nestjs/common';
import { CLIENTS_REPOSITORY } from '../ports/tokens';
import { ClientsRepository } from '../ports/clients.repository';

@Injectable()
export class GetPublicClientsByOrganizationUseCase {
  constructor(
    @Inject(CLIENTS_REPOSITORY)
    private readonly repo: ClientsRepository,
  ) {}

  execute(orgId: string) {
    if (!orgId) {
      throw new Error('orgId requerido');
    }

    return this.repo.findPublicClientsByOrganization(orgId);
  }
}
