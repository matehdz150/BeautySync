"use client";

import { DateTime } from "luxon";

export function NowLine({ show, top }: { show: boolean; top: number }) {
  if (!show) return null;

  const nowLabel = DateTime.now().toFormat("HH:mm");

  return (
    <div
      className="absolute left-2 right-0 flex items-center pointer-events-none z-49"
      style={{ top }}
    >
      {/* LEFT TIME PILL */}
      <div className="">
        <div className="px-2 py-0.5 rounded-full border border-[#a1002b] bg-white text-[#a1002b] text-[10px] font-semibold shadow-sm">
          {nowLabel}
        </div>
      </div>

      {/* LINE */}
      <div className="flex-1 h-[2px] bg-[#a1002b]" />
    </div>
  );
}