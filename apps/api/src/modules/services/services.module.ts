import { Module } from '@nestjs/common';
import { ServicesService } from './manager/services.service';
import { ServicesController } from './manager/services.controller';
import { ServicesPublicController } from './public/services.public.controller';
import { ServicesPublicService } from './public/services.public.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ServicesController, ServicesPublicController],
  providers: [ServicesService, ServicesPublicService],
})
export class ServicesModule {}
