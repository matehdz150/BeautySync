// src/modules/search/presentation/dto/global-search.dto.ts

import { IsOptional, IsString, IsNumber, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class GlobalSearchDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  // 🔥 NUEVO → tipo de búsqueda
  @IsOptional()
  @IsString()
  @IsIn(['all', 'branches', 'services', 'staff'])
  type?: 'all' | 'branches' | 'services' | 'staff';
}
