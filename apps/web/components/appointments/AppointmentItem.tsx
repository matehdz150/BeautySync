"use client";
import { motion } from "framer-motion";
import { cn, colorFromName } from "@/lib/utils";
import { DateTime } from "luxon";

export function AppointmentItem({
  a,
  isPast,
  onClick,
  ROW_HEIGHT = 20,
  MINUTES_PER_SLOT = 15,
  OFF_HOURS = false
}: any) {

  const base = colorFromName(a.staffName ?? "");
  const bg = OFF_HOURS ? "#D1D5DB" : base;

  // 🔐 PARSEO SEGURO
  const start = DateTime.fromISO(a.startISO ?? "").toLocal();
  const end = DateTime.fromISO(a.endISO ?? "").toLocal();

  if (!start.isValid || !end.isValid) {
    console.warn("❌ Invalid appointment datetime", a);
    return null;
  }

  // ⏱ duración fallback
  const minutes =
    a.minutes ??
    end.diff(start, "minutes").minutes ??
    15;

  // 🕕 minutos desde 6am
  const minsFromStart =
    Math.max(0, start.hour * 60 + start.minute - 6 * 60);

  const startTime = start.toFormat("H:mm");
  const endTime = end.toFormat("H:mm");

  return (
    <div
      onClick={OFF_HOURS ? undefined : onClick}   // ⛔ no clickeable
      className={cn(
        "absolute left-1 right-1 rounded-sm px-2 py-1 border-l-4",
        OFF_HOURS ? "cursor-not-allowed" : "cursor-pointer"
      )}
      style={{
        top: (minsFromStart / MINUTES_PER_SLOT) * ROW_HEIGHT,
        height: (minutes / MINUTES_PER_SLOT) * ROW_HEIGHT,
        background: isPast ? "#E5E7EB" : bg,
        borderLeftColor: OFF_HOURS ? "#D1D5DB" : base,
        color: OFF_HOURS ? "#111827" : isPast ? "#6B7280" : "inherit",
        opacity: isPast ? 0.8 : 1,
        pointerEvents: OFF_HOURS ? "none" : "auto",
      }}
    >

      {/* 🕓 HEADER LINE */}
      <p className="text-[12px] font-medium">
        {startTime} — {endTime}
        {!OFF_HOURS && (
          <>
            {" "}
            · <span className="font-semibold">{a.client}</span>
          </>
        )}
      </p>

      {/* 📌 BODY */}
      <div className="flex items-center gap-1">
        {OFF_HOURS ? (
          <p className="text-[11px] opacity-80">
            Fuera de horario
          </p>
        ) : (
          <p className="text-[11px] opacity-80 truncate">
            {typeof a.service === "string"
              ? a.service
              : a.service?.name ?? a.serviceName ?? "Service"}
          </p>
        )}
      </div>
    </div>
  );
}