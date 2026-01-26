// payments/services/validatePayment.ts
import { BadRequestException } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';

export function validatePayment(dto: CreatePaymentDto) {
  if (!dto.items || dto.items.length === 0) {
    throw new BadRequestException('Payment must have at least one item');
  }

  for (const item of dto.items) {
    if (item.amountCents === 0) {
      throw new BadRequestException('Payment items cannot have zero amount');
    }
  }

  const hasCharge = dto.items.some((i) => i.amountCents > 0);
  if (!hasCharge) {
    throw new BadRequestException('Payment must include at least one charge');
  }
}
