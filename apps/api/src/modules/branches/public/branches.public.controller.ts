import { Controller, Get, Param } from '@nestjs/common';
import { BranchesPublicService } from './branches.public.service';

@Controller('branches')
export class BranchesPublicController {
  constructor(private readonly service: BranchesPublicService) {}

  // GET /branches/:slug
  @Get(':slug')
  getPublicBranch(@Param('slug') slug: string) {
    return this.service.getBySlug(slug);
  }
}
