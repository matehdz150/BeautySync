import { BadRequestException, Inject } from '@nestjs/common';
import * as usersRepository from '../../ports/users.repository';
import * as passwordHasherPort from '../../ports/password-hasher.port';
import { PASSWORD_HASHER, USERS_REPOSITORY } from '../../ports/tokens';

export class RegisterAdminUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private usersRepo: usersRepository.UsersRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private hasher: passwordHasherPort.PasswordHasherPort,
  ) {}

  async execute(input: {
    email: string;
    password: string;
    role: string;
    organizationId?: string | null;
  }) {
    const existing = await this.usersRepo.findByEmail(input.email);

    if (existing) {
      throw new BadRequestException('Email already exists');
    }

    if (!['owner', 'manager', 'staff'].includes(input.role)) {
      throw new BadRequestException('Invalid role');
    }

    const passwordHash = await this.hasher.hash(input.password);

    return this.usersRepo.create({
      email: input.email,
      passwordHash,
      role: input.role,
      organizationId: input.organizationId ?? null,
    });
  }
}
