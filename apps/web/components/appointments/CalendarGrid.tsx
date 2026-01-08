"use client";

import { useState } from "react";
import { DateTime } from "luxon";

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
  isDisabled
}: Props) {
  const [hoverTime, setHoverTime] = useState<string | null>(null);
  const [hoverY, setHoverY] = useState<number>(0);

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
              ${disabled ? "bg-gray-200 opacity-60 pointer-events-none " : "hover:bg-[#ededed] cursor-pointer"}
            `}
            onMouseEnter={(e) => {
              if (disabled) return;
              setHoverTime(t);
              setHoverY(e.currentTarget.offsetTop);
            }}
            onMouseLeave={() => setHoverTime(null)}
            onClick={() => {
              if (disabled) return;

              const [h, m] = t.split(":").map(Number);

              const startISO = DateTime.fromISO(selectedDate)
                .set({ hour: h, minute: m, second: 0, millisecond: 0 })
                .toISO();

              onSlotClick?.(startISO!, staffId);
            }}
          />
        );
      })}
    </div>
  );
}