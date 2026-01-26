/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, MinLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString()
  @MinLength(2)
  name!: string;
}
