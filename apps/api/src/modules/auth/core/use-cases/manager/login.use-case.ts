import { Inject, UnauthorizedException } from '@nestjs/common';
import * as usersRepository from '../../ports/users.repository';
import * as passwordHasherPort from '../../ports/password-hasher.port';
import { LoginResult } from '../../entities/user.entity';
import { PASSWORD_HASHER, USERS_REPOSITORY } from '../../ports/tokens';

export class LoginUseCase {
  constructor(
    @Inject(USERS_REPOSITORY)
    private usersRepo: usersRepository.UsersRepositoryPort,
    @Inject(PASSWORD_HASHER)
    private hasher: passwordHasherPort.PasswordHasherPort,
  ) {}

  async execute(email: string, password: string): Promise<LoginResult> {
    const user = await this.usersRepo.findByEmail(email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const valid = await this.hasher.compare(password, user.passwordHash);

    if (!valid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const needsOnboarding = !user.organizationId;

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId ?? null,
        needsOnboarding,
      },
    };
  }
}
