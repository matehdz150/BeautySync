import { Module } from '@nestjs/common';
import { IaController } from './ia.controller';
import { AiService } from './ia.service';
import { GroqService } from './groq.service';
import { BranchesModule } from '../branches/manager/branches.module';

@Module({
  imports: [BranchesModule],
  controllers: [IaController],
  providers: [AiService, GroqService],
})
export class IaModule {}
