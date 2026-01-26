import { Controller, Post, Param } from '@nestjs/common';
import { AiService } from './ia.service';

@Controller('ia')
export class IaController {
  constructor(private readonly iaService: AiService) {}

  @Post('branches/:branchId/description')
  generateBranchDescription(@Param('branchId') branchId: string) {
    return this.iaService.generateBranchDescription(branchId);
  }
}
