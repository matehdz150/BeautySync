"use client";

import { cn } from "@/lib/utils";
import { DateTime } from "luxon";

export function TimeOffItem({
  t,
  onClick,
  ROW_HEIGHT = 20,
  MINUTES_PER_SLOT = 15,
}: any) {
  const start = DateTime.fromISO(t.startISO ?? "").toLocal();
  const end = DateTime.fromISO(t.endISO ?? "").toLocal();

  if (!start.isValid || !end.isValid) return null;

  const minutes = t.minutes ?? end.diff(start, "minutes").minutes ?? 15;

  const minsFromStart = Math.max(0, start.hour * 60 + start.minute - 6 * 60);

  const startTime = start.toFormat("H:mm");
  const endTime = end.toFormat("H:mm");

  return (
    <div
      onClick={onClick} 
      className={cn(
        "absolute left-1 right-1 rounded-sm px-2 py-1 cursor-pointer"
      )}
      style={{
        top: (minsFromStart / MINUTES_PER_SLOT) * ROW_HEIGHT,
        height: (minutes / MINUTES_PER_SLOT) * ROW_HEIGHT,
        background: "#E5E7EB", // gris
        color: "#374151",
      }}
    >
      {/* HEADER */}
      <p className="text-[12px] font-medium">
        {startTime} — {endTime}
      </p>

      {/* BODY */}
      <p className="text-[11px] opacity-80 truncate">
        {t.reason ?? "Bloqueado"}
      </p>
    </div>
  );
}