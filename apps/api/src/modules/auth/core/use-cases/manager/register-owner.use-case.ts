import { BadRequestException, Inject } from '@nestjs/common';
import * as usersRepository from '../../ports/users.repository';
import * as passwordHasherPort from '../../ports/password-hasher.port';
import { PASSWORD_HASHER, USERS_REPOSITORY } from '../../ports/tokens';

export class RegisterOwnerUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private usersRepo: usersRepository.UsersRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private hasher: passwordHasherPort.PasswordHasherPort,
  ) {}

  async execute(input: { email: string; password: string }) {
    const existing = await this.usersRepo.findByEmail(input.email);

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    const passwordHash = await this.hasher.hash(input.password);

    const user = await this.usersRepo.create({
      email: input.email,
      passwordHash,
      role: 'owner',
      organizationId: null,
    });

    return user;
  }
}
