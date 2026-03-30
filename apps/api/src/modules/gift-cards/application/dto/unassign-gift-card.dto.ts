import { IsUUID } from 'class-validator';

export class UnAssignGiftCardDto {
  @IsUUID()
  giftCardId!: string;

  @IsUUID()
  userId!: string;
}
