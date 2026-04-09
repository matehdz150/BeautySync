"use client";

import { Settings, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DualMonthDatePicker } from "./HeaderComponents/DualMonthDatePicker";
import { AddMenu } from "./HeaderComponents/AddMenu";
import { DateTime } from "luxon";
import { useCalendarActions } from "@/context/CalendarContext";
import { CalendarRefreshButton } from "./HeaderComponents/ReloadButton";
import { CalendarVisibilityMenu } from "./HeaderComponents/CalendarVisibilityMenu";
import { CalendarSettingsButton } from "./CalendarSettingsSheet/CalendarSettingsButton";
import { useTimeOffActions } from "@/context/TimeOffDraftContext";

type Props = {
  date: string;
  onDateChange: (date: string) => void;
  dailyCounts?: Record<string, number>;
  todayCount?: number;
  onNew?: () => void | React.Dispatch<React.SetStateAction<boolean>>;
};

export function AppointmentsHeader({ date, onDateChange }: Props) {
  const { openNewAppointment, openBlockTime } = useCalendarActions();
  const { init, reset } = useTimeOffActions();
  const jsDate = DateTime.fromISO(date).toJSDate();
  return (
    <div className="flex items-center justify-between gap-3 py-5 px-3 sticky top-0 z-50 border-b bg-white ">
      {/* LEFT GROUP */}
      <div className="flex items-center gap-2">
        {/* Today */}
        <Button
          variant="outline"
          className="rounded-full shadow-none"
          onClick={() => {
            const today = DateTime.now().toISODate();
            if (today) {
              onDateChange(today);
            }
          }}
        >
          Hoy
        </Button>
        {/* Prev / Date / Next */}
        <DualMonthDatePicker
          date={jsDate}
          onChange={(d) => {
            const nextDate = DateTime.fromJSDate(d).toISODate();
            if (nextDate) {
              onDateChange(nextDate);
            }
          }}
        />
        {/* Team */}
        <CalendarVisibilityMenu />
      </div>

      {/* RIGHT GROUP */}
      <div className="flex items-center gap-2">
        <CalendarSettingsButton />

        <CalendarRefreshButton />

        {/* Add */}
        <AddMenu
          onAppointment={() => openNewAppointment()}
          onGroupAppointment={() => console.log("group")}
          onBlockedTime={() => {
            reset(); // 🔥 limpia estado anterior
            init(); // 🔥 inicializa nuevo
            openBlockTime(); // 🔥 abre sheet
          }}
          onSale={() => console.log("sale")}
          onQuickPayment={() => console.log("payment")}
        />
      </div>
    </div>
  );
}
