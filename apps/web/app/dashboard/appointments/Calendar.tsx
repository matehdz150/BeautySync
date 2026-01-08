"use client";

import { SetStateAction, useEffect, useRef, useState } from "react";
import { DateTime } from "luxon";
import { useBranch } from "@/context/BranchContext";

import { getAppointmentsByDay } from "@/lib/services/appointments";
import { getStaffByBranch } from "@/lib/services/staff";

import { TimeColumn } from "@/components/appointments/TimeColumn";
import { StaffColumn } from "@/components/appointments/StaffColumn";
import { useCurrentMinute } from "@/hooks/UseCurrentMinute";
import { EventPopover } from "@/components/appointments/EventPopover";
import { AnimatePresence } from "framer-motion";
import { AppointmentsHeader } from "@/components/appointments/PageComponents/AppointmentsHeader";
import { StaffStickyHeader } from "@/components/appointments/PageComponents/StaffStickyHeader";
import { NowLine } from "@/components/appointments/NowLine";
import { NewAppointmentSheet } from "@/components/appointments/PageComponents/NewAppointmentSheet/NewAppointmentSheet";
import { getScheduleForStaff } from "@/lib/services/staffSchedules";
import { getConceptualStatus } from "@/lib/helpers/conceptualStatus";

const timeSlots = Array.from({ length: (24 - 6) * 4 + 1 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 15;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
});

const ROW_HEIGHT = 40;
const MINUTES_PER_SLOT = 30;



type Prefill = {
  defaultStaffId?: string;
  startISO: string;
};

export type CalendarAppointment = {
  id: string;
  staffId: string;
  staffName: string;

  client: string;

  service: string;
  serviceColor: string;

  startISO: string;
  endISO: string;

  conceptualStatus: "upcoming" | "ongoing" | "past";

  startTime: string;
  minutes: number;
};

export default function Calendar() {
  const { branch } = useBranch();

  const [date, setDate] = useState(DateTime.now().toISODate());
  const [staff, setStaff] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [dailyCounts, setDailyCounts] = useState<Record<string, number>>({});
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefill, setPrefill] = useState<Prefill>({});
  const [schedules, setSchedules] = useState<Record<string, any[]>>({});

  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null);

  const calendarRef = useRef<HTMLDivElement>(null);

  

  function addAppointmentsToCalendarIfToday(newOnes: CalendarAppointment[]) {
    const today = selectedDay.toISODate();

    const sameDay = newOnes.filter(
      (a) => DateTime.fromISO(a.startISO).toISODate() === today
    );

    if (sameDay.length === 0) return;

    setAppointments((prev) =>
      [...prev, ...sameDay].sort(
        (a, b) =>
          DateTime.fromISO(a.startISO).toMillis() -
          DateTime.fromISO(b.startISO).toMillis()
      )
    );
  }

  // 🔥 reloj ultra preciso a minuto exacto
  const now = useCurrentMinute();

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelectedEvent(null);
    setAnchorRect(null);
  }, [date]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      // si no hay popover abierto → nada
      if (!anchorRect) return;

      const popover = document.getElementById("event-popover");
      if (popover && popover.contains(e.target as Node)) return;

      setSelectedEvent(null);
      setAnchorRect(null);
    }

    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [anchorRect]);

  // 📅 cargar datos
  useEffect(() => {
    if (!branch) return;

    async function load() {
      // staff
      // staff
      const s = await getStaffByBranch(branch.id);
      setStaff(s);

      // schedules
      const all = await Promise.all(s.map((st) => getScheduleForStaff(st.id)));

      const schedMap: Record<string, any[]> = {};
      s.forEach((st, i) => (schedMap[st.id] = all[i]));

      setSchedules(schedMap);

      // citas del día
      const dayRes = await getAppointmentsByDay({
        branchId: branch.id,
        date,
      });

      console.log(dayRes);

      setAppointments(
        dayRes.data.map((a) => ({
          id: a.id,
          staffId: a.staff.id,
          staffName: a.staff.name,
          client: a.client?.name ?? "Cliente",
          serviceName: a.service?.name ?? "",
          serviceColor: a.service?.categoryColor ?? "#A78BFA",
          serviceIcon: a.service?.categoryIcon ?? undefined,
          startISO: a.start,
          endISO: a.end,
          startTime: DateTime.fromISO(a.start).toLocal().toFormat("H:mm"),
          minutes: DateTime.fromISO(a.end).diff(
            DateTime.fromISO(a.start),
            "minutes"
          ).minutes,
          conceptualStatus: getConceptualStatus(a.start, a.end)
        }))
      );

      // conteo semanal
      const selected = DateTime.fromISO(date);
      const startOfWeek = selected.startOf("week").plus({ days: 1 });

      const weekDays = [...Array(7)].map(
        (_, i) => startOfWeek.plus({ days: i }).toISODate()!
      );

      const weekRes = await Promise.all(
        weekDays.map((d) =>
          getAppointmentsByDay({ branchId: branch.id, date: d })
        )
      );

      const counts: Record<string, number> = {};
      weekRes.forEach((res, i) => {
        counts[weekDays[i]] = res.data.length;
      });

      setDailyCounts(counts);
    }

    void load();
  }, [branch, date]);

  // 🎯 línea roja — mismos cálculos que ya tenías
  const selectedDay = DateTime.fromISO(date);
  const nowLocal = now.setZone(selectedDay.zoneName);
  const isToday = nowLocal.hasSame(selectedDay, "day");

  const firstSlotMinutes = (() => {
    const [h, m] = timeSlots[0].split(":").map(Number);
    return h * 60 + m;
  })();

  const lastSlotMinutes = (() => {
    const [h, m] = timeSlots[timeSlots.length - 1].split(":").map(Number);
    return h * 60 + m;
  })();

  const minutesToday = nowLocal.hour * 60 + nowLocal.minute;

  const showNowLine =
    isToday &&
    minutesToday >= firstSlotMinutes &&
    minutesToday <= lastSlotMinutes;

  const nowTop =
    ((minutesToday - firstSlotMinutes) / MINUTES_PER_SLOT) * ROW_HEIGHT;

  return (
    <div className=" mx-auto bg-[white]   ">
      {/* HEADER */}
      <AppointmentsHeader
        date={date}
        onDateChange={setDate}
        dailyCounts={dailyCounts}
        todayCount={appointments.length}
        onNew={() => setDialogOpen(true)}
      />

      <StaffStickyHeader staff={staff} top={72} />

      {/* GRID */}
      <div
        ref={calendarRef}
        className="overflow-y-auto overflow-x-hidden relative"
        style={{ height: "calc(70vh)" }}
      >
        <NowLine show={showNowLine} top={nowTop} />
        <div className="flex">
          {/* LEFT COLUMN (TIMES) */}
          <TimeColumn timeSlots={timeSlots} />

          {/* STAFF COLUMNS */}
          {staff.map((s) => (
            <StaffColumn
              key={s.id}
              staff={s}
              schedules={schedules[s.id] ?? []}
              appointments={appointments}
              timeSlots={timeSlots}
              date={date}
              onSlotClick={(startISO, staffId) => {
                const d = DateTime.fromISO(startISO).toLocal();

                setDialogOpen(true);

                setPrefill({
                  defaultStaffId: staffId,
                  startISO: startISO, // <-- GUARDA ESTO
                });
              }}
              onEventClick={(
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                event: any,
                rect: SetStateAction<DOMRect | null>
              ) => {
                setSelectedEvent(event);
                setAnchorRect(rect);
              }}
            />
          ))}
        </div>
      </div>
      <AnimatePresence mode="wait">
        {selectedEvent && (
          <EventPopover
            key={selectedEvent.id}
            event={selectedEvent}
            rect={anchorRect}
            containerRef={calendarRef}
            onClose={() => setSelectedEvent(null)}
          />
        )}
      </AnimatePresence>
      <NewAppointmentSheet
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultStaffId={prefill.defaultStaffId}
        startISO={prefill.startISO}
        onAppointmentsCreated={addAppointmentsToCalendarIfToday}
      />
    </div>
  );
}
