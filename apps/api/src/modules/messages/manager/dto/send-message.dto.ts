import { IsUUID, IsString, MinLength, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsUUID()
  bookingId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  body!: string;
}
