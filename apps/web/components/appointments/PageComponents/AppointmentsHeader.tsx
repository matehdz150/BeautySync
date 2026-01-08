"use client";

import {
  ChevronLeft,
  ChevronRight,
  Settings,
  CalendarFold,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { DualMonthDatePicker } from "./HeaderComponents/DualMonthDatePicker";
import { AddMenu } from "./HeaderComponents/AddMenu";
import { DateTime } from "luxon";

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
  onToday,
  date,
  onDateChange,
  view,
  onNew
}: Props) {
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
        <Button variant="outline" className="rounded-full gap-2 shadow-none">
          Visibilidad del equipo
          <ChevronDown className="w-4 h-4" />
        </Button>
        {/* Filters */}
        <Button variant="outline" className="rounded-full shadow-none">
          <SlidersHorizontal className="w-4 h-4" />
        </Button>
      </div>

      {/* RIGHT GROUP */}
      <div className="flex items-center gap-2">
        <Button variant="outline" className="rounded-full shadow-none">
          <Settings className="w-4 h-4" />
        </Button>

        <Button variant="outline" className="rounded-full shadow-none">
          <CalendarFold className="w-4 h-4" />
        </Button>

        <Button variant="outline" className="rounded-full shadow-none">
          <RefreshCw className="w-4 h-4" />
        </Button>

        {/* View mode */}
        <Button variant="outline" className="rounded-full gap-2 shadow-none">
          {view === "day" ? "Day" : view === "week" ? "Week" : "Month"}
          <ChevronDown className="w-4 h-4" />
        </Button>

        {/* Add */}
        <AddMenu
          onAppointment={onNew}
          onGroupAppointment={() => console.log("group")}
          onBlockedTime={() => console.log("block")}
          onSale={() => console.log("sale")}
          onQuickPayment={() => console.log("payment")}
        />
      </div>
    </div>
  );
}
