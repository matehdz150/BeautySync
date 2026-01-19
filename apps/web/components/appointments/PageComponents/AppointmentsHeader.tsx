"use client";

import {
  Settings,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DualMonthDatePicker } from "./HeaderComponents/DualMonthDatePicker";
import { AddMenu } from "./HeaderComponents/AddMenu";
import { DateTime } from "luxon";
import { useCalendarActions } from "@/context/CalendarContext";
import { CalendarRefreshButton } from "./HeaderComponents/ReloadButton";
import { CalendarVisibilityMenu } from "./HeaderComponents/CalendarVisibilityMenu";
import { CalendarSettingsButton } from "./CalendarSettingsSheet/CalendarSettingsButton";

type Props = {
  onToday?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  currentLabel: string; // Ej: "Mon 1 Dec"
  locationLabel: string;
  teamLabel: string;
  view: "day" | "week" | "month";
  onViewChange?: (v: "day" | "week" | "month") => void;
  onAdd?: () => void;
  date: string;
  onDateChange: () => void;
  onNew: () => void | React.Dispatch<React.SetStateAction<boolean>>;
};

export function AppointmentsHeader({
  date,
  onDateChange}: Props) {
  const { openNewAppointment } = useCalendarActions();
  const jsDate = DateTime.fromISO(date).toJSDate();
  return (
    <div className="flex items-center justify-between gap-3 py-5 px-3 sticky top-0 z-50 border-b bg-white ">
      {/* LEFT GROUP */}
      <div className="flex items-center gap-2">
        {/* Today */}
        <Button
          variant="outline"
          className="rounded-full shadow-none"
          onClick={() => onDateChange(DateTime.now().toISODate())}
        >
          Hoy
        </Button>
        {/* Prev / Date / Next */}
        <DualMonthDatePicker
          date={jsDate}
          onChange={(d) => onDateChange(DateTime.fromJSDate(d).toISODate())}
        />
        {/* Team */}
        <CalendarVisibilityMenu/>
      </div>

      {/* RIGHT GROUP */}
      <div className="flex items-center gap-2">
        <CalendarSettingsButton/>


        <CalendarRefreshButton/>


        {/* Add */}
        <AddMenu
          onAppointment={() => openNewAppointment()}
          onGroupAppointment={() => console.log("group")}
          onBlockedTime={() => console.log("block")}
          onSale={() => console.log("sale")}
          onQuickPayment={() => console.log("payment")}
        />
      </div>
    </div>
  );
}
