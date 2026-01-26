import { Module } from '@nestjs/common';
import { ServicesService } from './manager/services.service';
import { ServicesController } from './manager/services.controller';
import { ServicesPublicController } from './public/services.public.controller';
import { ServicesPublicService } from './public/services.public.service';

@Module({
  controllers: [ServicesController, ServicesPublicController],
  providers: [ServicesService, ServicesPublicService],
})
export class ServicesModule {}
