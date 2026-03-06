import BookingCard from "./BookingCard";

interface Props {
  month: string;
  bookings: any[];
}

export default function BookingMonthGroup({ month, bookings }: Props) {
  return (
    <div className="mb-12">
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-muted-foreground capitalize">
          {month}
        </h3>
      </div>

      <div className="space-y-10">
        {bookings.map((booking) => (
          <BookingCard key={booking.id} booking={booking} />
        ))}
      </div>
    </div>
  );
}