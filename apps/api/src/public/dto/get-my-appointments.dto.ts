import { IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetMyPublicAppointmentsQueryDto {
  @IsOptional()
  @IsIn(['UPCOMING', 'PAST', 'ALL'])
  tab?: 'UPCOMING' | 'PAST' | 'ALL';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number;

  /**
   * Cursor ISO en UTC (ej: 2026-01-22T16:30:00.000Z)
   * - UPCOMING: trae start > cursor
   * - PAST: trae start < cursor
   */
  @IsOptional()
  @IsString()
  cursor?: string;
}
