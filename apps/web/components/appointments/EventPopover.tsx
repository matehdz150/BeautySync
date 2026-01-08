"use client";

import { motion } from "framer-motion";
import { DateTime } from "luxon";
import { EventActions } from "./EventActions";

export function EventPopover({ event, rect, containerRef, onClose }: any) {

  // eslint-disable-next-line react-hooks/refs
  if (!event || !rect || !containerRef?.current) return null;

  // eslint-disable-next-line react-hooks/refs
  const containerRect = containerRef.current.getBoundingClientRect();

  const top = rect.top - containerRect.top + rect.height + 80;
  const left = rect.left - containerRect.left - 260;

  const start = DateTime.fromISO(event.startISO).toLocal();
  const end = start.plus({ minutes: event.minutes });

  const dateLabel = start
    .setLocale("es")
    .toFormat("cccc, d LLLL")
    .replace(/(^\w)/, m => m.toUpperCase());

  const startTime = start.toFormat("HH:mm");
  const endTime = end.toFormat("HH:mm");

  return (
    <div id="event-popover" className="absolute z-50" style={{ top, left }}>
      <motion.div
        initial={{ opacity: 0, x: -25, scale: 0.97 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: -15, scale: 0.97 }}   // 👈 salida suave
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="bg-white shadow-2xl rounded-2xl p-4 w-80 border"
        onClick={(e) => e.stopPropagation()}
      >
        {/* HEADER */}
        <div className="flex justify-between items-start gap-2">
          <div>
            <div className="flex items-center gap-2">
              <div
                className="w-3.5 h-3.5 rounded-sm"
                style={{ backgroundColor: event.serviceColor || "#A78BFA" }}
              />
              <h3 className="font-semibold text-lg leading-tight">
                {event.client}
              </h3>
            </div>

            <p className="text-sm opacity-70 mt-0.5">
              {event.service}
            </p>
          </div>

          <EventActions onClose={onClose} />
        </div>

        {/* FECHA */}
        <div className="mt-4 text-sm font-normal text-gray-900">
          {dateLabel}
          <span className="mx-1.5 text-gray-400">·</span>
          <span className="opacity-80">
            {startTime} — {endTime}
          </span>
        </div>

        {/* DURACIÓN */}
        <div className="mt-2 text-sm opacity-70">
          <span className="font-normal opacity-90">
            {event.minutes} min
          </span>
        </div>

      </motion.div>
    </div>
  );
}