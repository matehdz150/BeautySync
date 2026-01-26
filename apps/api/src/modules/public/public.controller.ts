import { Controller } from '@nestjs/common';
import { PublicService } from './public.service';

@Controller('public/branches')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}
}
