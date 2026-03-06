interface Props {
  bookings: any[];
}

export default function SalesSection({ bookings }: Props) {
  const total = bookings.reduce(
    (acc: number, booking: any) => acc + booking.totalCents,
    0
  );

  return (
    <section>
      <h2 className="text-lg font-semibold mb-4">Ventas</h2>

      <div className="text-3xl font-bold">
        ${(total / 100).toLocaleString()}
      </div>
    </section>
  );
}