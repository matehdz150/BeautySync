// src/modules/search/presentation/dto/global-search.dto.ts

import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
export class GlobalSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsString()
  @IsIn(['all', 'branches', 'services', 'staff'])
  type?: 'all' | 'branches' | 'services' | 'staff';

  // 🔥 cursor
  @IsOptional()
  @IsString()
  cursor?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  limit?: number;
}
