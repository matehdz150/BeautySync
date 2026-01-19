"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { colorFromName } from "@/lib/utils";

type Staff = {
  id: string;
  name: string;
  avatarUrl?: string;
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
              {s.avatarUrl ? (
                <AvatarImage
                  src={s.avatarUrl}
                  alt={s.name}
                  className="w-12 h-12 rounded-full object-cover"
                  onError={(e) => {
                    // por si la imagen existe pero falla (Cloudinary, permisos, etc)
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
          <span className="text-sm font-medium text-gblack truncate">
            {s.name}
          </span>
        </div>
      ))}
    </div>
  );
}
