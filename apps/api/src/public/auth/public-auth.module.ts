import { Module } from '@nestjs/common';
import { PublicAuthController } from './public-auth.controller';
import { PublicAuthService } from './public-auth.service';
import { DbModule } from 'src/db/db.module';

@Module({
  imports: [DbModule],
  controllers: [PublicAuthController],
  providers: [PublicAuthService],
  exports: [PublicAuthService],
})
export class PublicAuthModule {}
