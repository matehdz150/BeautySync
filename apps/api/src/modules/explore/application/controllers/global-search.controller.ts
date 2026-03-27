// src/modules/search/presentation/controllers/global-search.controller.ts

import { Controller, Get, Query } from '@nestjs/common';
import { GlobalSearchUseCase } from '../../core/use-cases/global-search.use-case';
import { GlobalSearchDto } from '../dto/global-search.dto';

@Controller('search')
export class GlobalSearchController {
  constructor(private readonly useCase: GlobalSearchUseCase) {}

  @Get('global')
  async search(@Query() query: GlobalSearchDto) {
    return this.useCase.execute(query);
  }
}
