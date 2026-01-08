import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';

export class CreateServiceCategoryDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  icon: string;

  @IsHexColor()
  colorHex: string;
}
