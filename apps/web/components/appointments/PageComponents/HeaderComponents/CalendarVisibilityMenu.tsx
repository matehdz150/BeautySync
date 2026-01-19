"use client";

import { useMemo } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  CalendarCheck,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Sun,
  SunMoon,
  TreePalm,
  Users,
} from "lucide-react";
import { useCalendar, useCalendarActions } from "@/context/CalendarContext";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

/* ---------------------------------------------------- */
/* Utils                                                */
/* ---------------------------------------------------- */

function timeToMinutes(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

export function CalendarVisibilityMenu() {
  const { state } = useCalendar();
  const { setEnabledStaff } = useCalendarActions();

  const staff = state.staff;
  const enabledIds = state.view.enabledStaffIds;

  const today = DateTime.fromISO(state.date);
  const nowMinutes = DateTime.now().hour * 60 + DateTime.now().minute;

  /* ---------------------------------------------------- */
  /* Derived data                                         */
  /* ---------------------------------------------------- */

  const roles = useMemo(() => {
    return Array.from(new Set(staff.map((s: any) => s.role).filter(Boolean)));
  }, [staff]);

  const staffWorkingToday = useMemo(() => {
    const weekday = today.weekday;
    return staff.filter((s: any) =>
      (state.schedules[s.id] ?? []).some(
        (sch: any) => sch.dayOfWeek === weekday
      )
    );
  }, [staff, state.schedules, today]);

  const staffWithAppointmentsToday = useMemo(() => {
    return staff.filter((s: any) =>
      state.appointments.some(
        (a) => a.staffId === s.id && a.startISO.startsWith(state.date)
      )
    );
  }, [staff, state.appointments, state.date]);

  const staffFreeNow = useMemo(() => {
    return staff.filter((s: any) => {
      // ¿tiene cita activa ahora?
      const busy = state.appointments.some((a) => {
        if (a.staffId !== s.id) return false;

        const start = DateTime.fromISO(a.startISO);
        const end = DateTime.fromISO(a.endISO);

        return DateTime.now() >= start && DateTime.now() <= end;
      });

      return !busy;
    });
  }, [staff, state.appointments]);

  const staffMorning = useMemo(() => {
    return staff.filter((s: any) =>
      (state.schedules[s.id] ?? []).some(
        (sch: any) => timeToMinutes(sch.startTime) < 12 * 60
      )
    );
  }, [staff, state.schedules]);

  const staffAfternoon = useMemo(() => {
    return staff.filter((s: any) =>
      (state.schedules[s.id] ?? []).some(
        (sch: any) => timeToMinutes(sch.startTime) >= 12 * 60
      )
    );
  }, [staff, state.schedules]);

  /* ---------------------------------------------------- */
  /* Helpers                                              */
  /* ---------------------------------------------------- */

  const toggleStaff = (id: string) => {
    if (enabledIds.includes(id)) {
      setEnabledStaff(enabledIds.filter((s) => s !== id));
    } else {
      setEnabledStaff([...enabledIds, id]);
    }
  };

  const enableOnly = (list: any[]) => setEnabledStaff(list.map((s) => s.id));

  /* ---------------------------------------------------- */
  /* UI                                                   */
  /* ---------------------------------------------------- */

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="rounded-full gap-2 shadow-none">
          <Users className="w-4 h-4" />
          Visibilidad del equipo
          <ChevronDown className="w-4 h-4" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel>Filtros rápidos</DropdownMenuLabel>

        <DropdownMenuCheckboxItem
          className="pl-2"
          onCheckedChange={() => enableOnly(staffWorkingToday)}
        >
          <CalendarCheck />
          Quienes trabajan hoy
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          className="pl-2"
          onCheckedChange={() => enableOnly(staffWithAppointmentsToday)}
        >
          <ClipboardList />
          Con citas hoy
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          className="pl-2"
          onCheckedChange={() => enableOnly(staffFreeNow)}
        >
          <TreePalm />
          Libres ahora
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          className="pl-2"
          onCheckedChange={() => enableOnly(staffMorning)}
        >
          <Sun />
          Turno mañana
        </DropdownMenuCheckboxItem>

        <DropdownMenuCheckboxItem
          className="pl-2"
          onCheckedChange={() => enableOnly(staffAfternoon)}
        >
          <SunMoon />
          Turno tarde
        </DropdownMenuCheckboxItem>

        {/* ---------------- STAFF TOGGLE ---------------- */}
        <DropdownMenuLabel>Equipo</DropdownMenuLabel>

        <div className="max-h-56 overflow-y-auto space-y-1">
          {staff.map((s: any) => {
            const checked = enabledIds.includes(s.id);

            function toggle() {
              if (checked) {
                setEnabledStaff(enabledIds.filter((id) => id !== s.id));
              } else {
                setEnabledStaff([...enabledIds, s.id]);
              }
            }

            return (
              <DropdownMenuItem
                key={s.id}
                onSelect={(e) => {
                  e.preventDefault(); // 👈 evita que se cierre
                  toggle(); // 👈 AQUÍ está la magia
                }}
                className="flex items-center gap-3 px-3 py-2 cursor-pointer"
              >
                {/* CHECKBOX (SOLO VISUAL) */}
                <Checkbox
                  checked={checked}
                  className="
          pointer-events-none
          h-5 w-5
          data-[state=checked]:bg-indigo-500
          data-[state=checked]:border-indigo-500
          [&_svg]:stroke-white
        "
                />

                {/* AVATAR */}
                <Avatar className="w-8 h-8 shrink-0">
                  <AvatarImage src={s.avatarUrl} alt={s.name} />
                  <AvatarFallback className="text-xs font-semibold bg-indigo-100">
                    {s.name.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                {/* NAME */}
                <span className="text-sm">{s.name}</span>
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
