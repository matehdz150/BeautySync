import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../../core/ports/tokens';
import * as usersRepository from '../../core/ports/users.repository';

@Injectable()
export class GetUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: usersRepository.UsersRepository,
  ) {}

  execute(id: string) {
    return this.repo.findOne(id);
  }
}
