export class Payment {
  constructor(
    public id: string,
    public organizationId: string,
    public branchId: string,
    public bookingId: string | null,
    public clientId: string | null,
    public cashierStaffId: string,
    public status: 'pending' | 'paid' | 'failed' | 'refunded' | 'cancelled',
    public subtotalCents: number,
    public discountsCents: number,
    public taxCents: number,
    public totalCents: number,
    public createdAt: Date,
    public paidAt?: Date | null,
  ) {}
}
