import { IsString, IsOptional, IsNumber, Min } from 'class-validator';

export class CreateProductDto {
  @IsString()
  branchId!: string;
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  slug?: string;

  @IsNumber()
  @Min(0)
  priceCents!: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
