"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colorFromName } from "@/lib/utils";

type Staff = {
  id: string;
  name: string;
  avatar?: string;
};

export function StaffStickyHeader({
  staff,
  top = 72, // altura del AppointmentsHeader
}: {
  staff: Staff[];
  top?: number;
}) {
  
  return (
    <div className="flex bg-white z-40 border-b sticky" style={{ top }}>
      {/* Columna izquierda (horas vacía) */}
      <div className="w-14">&nbsp;</div>

      {/* Staff */}
      {staff.map((s, i) => (
        <div
          key={s.id}
          className="flex-1 flex flex-col items-center gap-2 py-5 px-2"
        >
          {/* Avatar wrapper con borde y gap blanco */}
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center bg-white"
            style={{
              boxShadow: `0 0 0 3px ${colorFromName(s.name)}`,
            }}
          >
            <Avatar key={s.id} className="w-12 h-12">
              <AvatarImage
                src={`https://randomuser.me/api/portraits/${
                  i % 2 === 0 ? "women" : "men"
                }/${Math.abs(i % 100)}.jpg`}
                alt={s.name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e) => {
                  // fallback si randomuser devuelve 404
                  (e.target as HTMLImageElement).src =
                    "https://randomuser.me/api/portraits/lego/1.jpg";
                }}
              />

              <AvatarFallback className="text-sm font-bold">
                {s.name?.slice(0, 2).toUpperCase() ?? "?"}
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Nombre */}
          <span className="text-sm font-medium text-gblack truncate">
            {s.name}
          </span>
        </div>
      ))}
    </div>
  );
}
