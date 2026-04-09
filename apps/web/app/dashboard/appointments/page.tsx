// app/dashboard/appointments/page.tsx
import { CalendarProvider } from "@/context/CalendarProvider";
import Calendar from "./Calendar";
import { TimeOffDraftProvider } from "@/context/TimeOffDraftContext";

export default function Page() {
  return (
    <CalendarProvider>
      <TimeOffDraftProvider>
        <Calendar />
      </TimeOffDraftProvider>
    </CalendarProvider>
  );
}
