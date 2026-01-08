import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { AuthController } from './auth.controller';
import { DbModule } from 'src/db/db.module'; // el que ya tienes para @Inject('DB')
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { RefreshJwtStrategy } from './refresh-jwt.strategy';
import { RefreshJwtGuard } from './refresh-jwt.guard';

@Module({
  imports: [
    DbModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_ACCESS_SECRET ?? 'dev_secret_change_me',
      signOptions: { expiresIn: '1h' }, // ACCESS TOKEN
    }),
  ],
  providers: [
    AuthService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    RefreshJwtStrategy,
    RefreshJwtGuard,
  ],
  controllers: [AuthController],
  exports: [
    AuthService,
    JwtModule,
    PassportModule,
    JwtAuthGuard,
    RolesGuard,
    RefreshJwtGuard,
  ],
})
export class AuthModule {}
