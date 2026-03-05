export interface BookingsRepositoryPort {
  findBookingServices(bookingId: string): Promise<
    {
      id: string;
      name: string;
      priceCents: number;
      staffId?: string | null;
    }[]
  >;
}
