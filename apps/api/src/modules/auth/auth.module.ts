import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/* CONTROLLERS */

import { AuthController } from './application/controllers/manager/auth-manager.controller';
import { PublicAuthController } from './application/controllers/public/auth-public.controller';

/* STRATEGIES */

import { JwtStrategy } from './infraestructure/strategies/jwt.strategy';

/* USE CASES */

import { LoginUseCase } from './core/use-cases/manager/login.use-case';
import { RegisterOwnerUseCase } from './core/use-cases/manager/register-owner.use-case';
import { ValidateInviteUseCase } from './core/use-cases/manager/validate-invite.use-case';
import { AcceptInviteUseCase } from './core/use-cases/manager/accept-invite.use-case';
import { RegisterAdminUseCase } from './core/use-cases/manager/register-admin.use-case';

import { LoginGoogleUseCase } from './core/use-cases/public/login-google.use-case';
import { GetUserBySessionUseCase } from './core/use-cases/public/get-user-by-session.use-case';
import { LogoutPublicUseCase } from './core/use-cases/public/logout-public.use-case';

/* ADAPTERS */

import { UsersDrizzleRepository } from './infraestructure/adapters/users-drizzle.repository';
import { BranchesDrizzleRepository } from './infraestructure/adapters/branches-drizzle.repository';
import { PublicUsersDrizzleRepository } from './infraestructure/adapters/public-user.drizzle.repository';
import { PublicSessionsDrizzleRepository } from './infraestructure/adapters/public-sessions-drizzle.repository';

import { BcryptPasswordHasher } from './infraestructure/adapters/bcrypt-password-hasher.adapter';
import { GoogleTokenVerifierAdapter } from './infraestructure/adapters/google-token-verifier.adapter';

/* TOKENS */

import {
  USERS_REPOSITORY,
  BRANCHES_REPOSITORY,
  PUBLIC_USERS_REPOSITORY,
  PUBLIC_SESSIONS_REPOSITORY,
  PASSWORD_HASHER,
  GOOGLE_TOKEN_VERIFIER,
  INVITES_REPOSITORY,
  STAFF_REPOSITORY,
} from './core/ports/tokens';
import { StaffInvitesDrizzleRepository } from './infraestructure/adapters/staff-invites-drizzle.repository';
import { StaffDrizzleRepository } from './infraestructure/adapters/staff-drizzle.repository';
import { TokensService } from './application/services/tokens.service';
import { BranchAccessGuard } from './application/guards/branch-access.guard';
import { JwtAuthGuard } from './application/guards/jwt-auth.guard';
import { OrganizationAccessGuard } from './application/guards/organization-access.guard';
import { PublicAuthGuard } from './application/guards/public-auth.guard';
import { RefreshJwtGuard } from './application/guards/refresh-jwt.guard';
import { RolesGuard } from './application/guards/roles.guard';
import { ValidateBranchAccessUseCase } from './core/use-cases/manager/validate-branch-access.use-case';
import { JwtRefreshStrategy } from './infraestructure/strategies/jwt-refresh.strategy';

@Module({
  imports: [JwtModule.register({})],

  controllers: [AuthController, PublicAuthController],

  providers: [
    /* USE CASES */

    LoginUseCase,
    RegisterOwnerUseCase,
    ValidateInviteUseCase,
    AcceptInviteUseCase,

    LoginGoogleUseCase,
    GetUserBySessionUseCase,
    LogoutPublicUseCase,
    RegisterAdminUseCase,
    ValidateBranchAccessUseCase,

    /* SERVICES */

    TokensService,

    /* STRATEGIES */

    JwtStrategy,
    JwtRefreshStrategy,

    /* PORT → ADAPTER */

    {
      provide: USERS_REPOSITORY,
      useClass: UsersDrizzleRepository,
    },

    {
      provide: BRANCHES_REPOSITORY,
      useClass: BranchesDrizzleRepository,
    },

    {
      provide: PUBLIC_USERS_REPOSITORY,
      useClass: PublicUsersDrizzleRepository,
    },

    {
      provide: PUBLIC_SESSIONS_REPOSITORY,
      useClass: PublicSessionsDrizzleRepository,
    },

    {
      provide: PASSWORD_HASHER,
      useClass: BcryptPasswordHasher,
    },

    {
      provide: GOOGLE_TOKEN_VERIFIER,
      useClass: GoogleTokenVerifierAdapter,
    },
    {
      provide: INVITES_REPOSITORY,
      useClass: StaffInvitesDrizzleRepository,
    },
    {
      provide: STAFF_REPOSITORY,
      useClass: StaffDrizzleRepository,
    },
    BranchAccessGuard,
    JwtAuthGuard,
    OrganizationAccessGuard,
    PublicAuthGuard,
    RefreshJwtGuard,
    RolesGuard,
  ],

  exports: [
    LoginUseCase,
    GetUserBySessionUseCase,
    ValidateBranchAccessUseCase,
    JwtStrategy,
    JwtRefreshStrategy,
    BranchAccessGuard,
    JwtAuthGuard,
    OrganizationAccessGuard,
    PublicAuthGuard,
    RefreshJwtGuard,
    RolesGuard,
  ],
})
export class AuthModule {}
