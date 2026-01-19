"use client";

import { useState } from "react";
import { DateTime } from "luxon";
import { useCalendarActions } from "@/context/CalendarContext";
import { getAvailableServicesForSlot } from "@/lib/services/availability";
import { useBranch } from "@/context/BranchContext";

type Props = {
  timeSlots: string[];
  staffId: string;
  selectedDate: string;
  onSlotClick?: (startISO: string, staffId: string) => void;
  isDisabled?: (time: string) => boolean;
};

export function CalendarGrid({
  timeSlots,
  staffId,
  selectedDate,
  onSlotClick,
  isDisabled,
}: Props) {
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const [hoverY, setHoverY] = useState<number>(0);
  const { openNewAppointment } = useCalendarActions();
  const { branch } = useBranch();

  return (
    <div className="relative">
      {hoverTime && (
        <div
          className="absolute -left-14 px-2 py-1 text-xs rounded bg-black text-white shadow z-50"
          style={{ top: hoverY }}
        >
          {hoverTime}
        </div>
      )}

      {timeSlots.map((t) => {
        const disabled = isDisabled?.(t) ?? false;
        const isFullHour = t.endsWith(":00");

        return (
          <div
            key={t}
            className={`
              h-5
              ${isFullHour ? "border-t border-muted bg-muted/10" : ""}
              ${
                disabled
                  ? "bg-gray-50 pointer-events-none "
                  : "hover:bg-[#ededed] cursor-pointer"
              }
            `}
            onMouseEnter={(e) => {
              if (disabled) return;
              setHoverTime(t);
              setHoverY(e.currentTarget.offsetTop);
            }}
            onMouseLeave={() => setHoverTime(null)}
            onClick={async () => {
              if (disabled) return;

              const branchId = branch?.id;
              if (!branchId) return; // por seguridad

              const [h, m] = t.split(":").map(Number);

              const startISO = DateTime.fromISO(selectedDate)
                .set({ hour: h, minute: m, second: 0, millisecond: 0 })
                .toISO();

              const services = await getAvailableServicesForSlot({
                branchId,
                staffId,
                datetime: startISO!,
              });

              console.log("Servicios disponibles en esa hora:", services);

              openNewAppointment({
                defaultStaffId: staffId,
                startISO,
                presetServices: services,
              });
            }}
          />
        );
      })}
    </div>
  );
}