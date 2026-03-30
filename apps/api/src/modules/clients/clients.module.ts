import { Module } from '@nestjs/common';

import { ClientsController } from './application/controllers/clients.controller';

import { AuthModule } from '../auth/auth.module';

/* USE CASES */
import { GetClientsUseCase } from './core/use-cases/get-clients.use-case';
import { GetClientUseCase } from './core/use-cases/get-client.use-case';
import { GetClientsByOrganizationUseCase } from './core/use-cases/get-client-by-org.use-case';
import { CreateClientUseCase } from './core/use-cases/create-client.use-case';
import { UpdateClientUseCase } from './core/use-cases/update-client.use-case';
import { DeleteClientUseCase } from './core/use-cases/delete-client.use-case';

/* PORT TOKEN */
import { CLIENTS_REPOSITORY } from './core/ports/tokens';

/* INFRA */
import { ClientsDrizzleRepository } from './infrastructure/adapters/clients-drizzle.repository';
import { GetClientEditUseCase } from './core/use-cases/get-client-edit.use-case';
import { GetPublicClientsByOrganizationUseCase } from './core/use-cases/get-public-clients.use-case';

@Module({
  imports: [AuthModule],

  controllers: [ClientsController],

  providers: [
    /* USE CASES */
    GetClientsUseCase,
    GetClientUseCase,
    GetClientsByOrganizationUseCase,
    CreateClientUseCase,
    UpdateClientUseCase,
    DeleteClientUseCase,
    GetClientEditUseCase,
    GetPublicClientsByOrganizationUseCase,

    /* REPOSITORY BINDING */
    {
      provide: CLIENTS_REPOSITORY,
      useClass: ClientsDrizzleRepository,
    },
  ],
})
export class ClientsModule {}
