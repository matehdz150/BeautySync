import { IsString } from 'class-validator';

export class AddNoteDto {
  @IsString()
  text!: string;
}

export class AddRuleDto {
  @IsString()
  text!: string;
}
