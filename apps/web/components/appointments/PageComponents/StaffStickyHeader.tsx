"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colorFromName } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCalendar, useCalendarActions } from "@/context/CalendarContext";

type Staff = {
  id: string;
  name: string;
  avatarUrl?: string;
};

export function StaffStickyHeader({
  staff,
  top = 72,
}: {
  staff: Staff[];
  top?: number;
}) {
  const { state } = useCalendar();
  const { nextStaffPage, prevStaffPage } = useCalendarActions();

  const canGoLeft = state.view.staffOffset > 0;

  const canGoRight =
    state.view.staffOffset + state.view.maxVisibleStaff <
    state.staff.length;

  return (
    <div className="flex items-center bg-white z-40 border-b sticky" style={{ top }}>
      {/* LEFT BUTTON */}
      <div className="w-14 flex items-center justify-center">
        <button
          onClick={prevStaffPage}
          disabled={!canGoLeft}
          className={`p-2 rounded-full transition
            ${canGoLeft 
              ? "hover:bg-gray-100 cursor-pointer" 
              : "opacity-30 cursor-not-allowed"
            }
          `}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      </div>

      {/* STAFF */}
      <div className="flex flex-1">
        {staff.map((s) => (
          <div
            key={s.id}
            className="flex-1 flex flex-col items-center gap-2 py-5 px-2 min-w-[120px]"
          >
            {/* Avatar */}
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center bg-white"
              style={{
                boxShadow: `0 0 0 3px ${colorFromName(s.name)}`,
              }}
            >
              <Avatar className="w-12 h-12">
                {s.avatarUrl ? (
                  <AvatarImage
                    src={s.avatarUrl}
                    alt={s.name}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                ) : null}

                <AvatarFallback className="text-sm font-bold bg-black text-white">
                  {s.name?.slice(0, 2).toUpperCase() ?? "?"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Nombre */}
            <span className="text-sm font-medium text-gblack truncate text-center">
              {s.name}
            </span>
          </div>
        ))}
      </div>

      {/* RIGHT BUTTON */}
      <div className="w-14 flex items-center justify-center">
        <button
          onClick={nextStaffPage}
          disabled={!canGoRight}
          className={`p-2 rounded-full transition
            ${canGoRight 
              ? "hover:bg-gray-100 cursor-pointer" 
              : "opacity-30 cursor-not-allowed"
            }
          `}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}