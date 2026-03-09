import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../../core/ports/tokens';
import * as usersRepository from '../../core/ports/users.repository';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: usersRepository.UsersRepository,
  ) {}

  execute(id: string, data: usersRepository.UpdateUserInput) {
    return this.repo.update(id, data);
  }
}
