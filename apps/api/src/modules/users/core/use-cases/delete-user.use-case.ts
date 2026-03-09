import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../../core/ports/tokens';
import * as usersRepository from '../../core/ports/users.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: usersRepository.UsersRepository,
  ) {}

  async execute(id: string) {
    await this.repo.remove(id);
    return { ok: true };
  }
}
