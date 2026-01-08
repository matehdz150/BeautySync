// app/dashboard/appointments/page.tsx
import { CalendarProvider } from "@/context/CalendarContext";
import Calendar from "./Calendar";

export default function Page() {
  return (
    <CalendarProvider>
      <Calendar />
    </CalendarProvider>
  );
}