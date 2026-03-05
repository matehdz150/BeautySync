import { paymentItemTypeEnum } from 'src/modules/db/schema';

export type PaymentItemType = (typeof paymentItemTypeEnum.enumValues)[number];

export class CreatePaymentItem {
  constructor(
    public type: PaymentItemType,
    public label: string,
    public amountCents: number,
    public referenceId?: string | null,
    public staffId?: string | null,
    public meta?: Record<string, unknown>,
  ) {}
}

export class PaymentItem {
  constructor(
    public id: string,
    public paymentId: string,
    public type: PaymentItemType,
    public label: string,
    public amountCents: number,
    public referenceId?: string | null,
    public staffId?: string | null,
    public meta?: Record<string, unknown>,
  ) {}
}
