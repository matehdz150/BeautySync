import { IsUUID } from 'class-validator';

export class AssignGiftCardDto {
  @IsUUID()
  giftCardId!: string;

  @IsUUID()
  userId!: string;
}
