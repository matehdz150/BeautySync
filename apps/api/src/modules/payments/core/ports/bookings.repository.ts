export interface BookingsRepositoryPort {
  findBookingServices(bookingId: string): Promise<
    {
      id: string;
      name: string;
      priceCents: number;
      staffId?: string | null;
    }[]
  >;
  findBookingClient(bookingId: string): Promise<{
    id: string;
    name: string | null;
    email?: string | null;
    phone?: string | null;
  } | null>;
}
