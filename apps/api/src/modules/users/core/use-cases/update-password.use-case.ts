import { Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../../core/ports/tokens';
import * as usersRepository from '../../core/ports/users.repository';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UpdatePasswordUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: usersRepository.UsersRepository,
  ) {}

  async execute(id: string, password: string) {
    const passwordHash = await bcrypt.hash(password, 10);

    await this.repo.updatePassword(id, passwordHash);

    return { ok: true };
  }
}
