import { Module } from '@nestjs/common';

/* CONTROLLER */

import { UsersController } from './application/controllers/users.controller';

/* USE CASES */

import { GetUsersUseCase } from './core/use-cases/get-users.use-case';
import { GetUserUseCase } from './core/use-cases/get-user.use-case';
import { CreateUserUseCase } from './core/use-cases/create-user.use-case';
import { UpdateUserUseCase } from './core/use-cases/update-user.use-case';
import { UpdatePasswordUseCase } from './core/use-cases/update-password.use-case';
import { DeleteUserUseCase } from './core/use-cases/delete-user.use-case';

/* REPOSITORY */

import { UsersDrizzleRepository } from './infrastructure/adapters/users-drizzle.repository';

/* TOKENS */

import { USERS_REPOSITORY } from './core/ports/tokens';

@Module({
  controllers: [UsersController],

  providers: [
    /* USE CASES */

    GetUsersUseCase,
    GetUserUseCase,
    CreateUserUseCase,
    UpdateUserUseCase,
    UpdatePasswordUseCase,
    DeleteUserUseCase,

    /* REPOSITORY ADAPTER */

    {
      provide: USERS_REPOSITORY,
      useClass: UsersDrizzleRepository,
    },
  ],

  exports: [GetUserUseCase, CreateUserUseCase],
})
export class UsersModule {}
