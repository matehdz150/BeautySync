import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { USERS_REPOSITORY } from '../ports/tokens';
import * as usersRepository from '../ports/users.repository';

@Injectable()
export class CreateUserUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly repo: usersRepository.UsersRepository,
  ) {}

  async execute(data: usersRepository.CreateUserInput) {
    const exists = await this.repo.findByEmail(data.email);

    if (exists) {
      throw new BadRequestException('Email already registered');
    }

    return this.repo.create(data);
  }
}
