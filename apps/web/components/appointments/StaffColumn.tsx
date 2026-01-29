"use client";

import { DateTime } from "luxon";
import { AppointmentItem } from "./AppointmentItem";
import { CalendarGrid } from "./CalendarGrid";
import { useEffect, useState } from "react";
import { getScheduleForStaff } from "@/lib/services/staffSchedules";
import { useCalendarActions } from "@/context/CalendarContext";

type Staff = {
  id: string;
  name: string;
};

type Appointment = any;

export function StaffColumn({
  staff,
  appointments,
  timeSlots,
  onSlotClick,
  date,
}: any) {
  const getTimeIndex = (t: string) => timeSlots.indexOf(t);
  const [schedule, setSchedule] = useState<any[]>([]);

  const { openAppointmentById } = useCalendarActions();

  // 📅 LOAD STAFF SCHEDULE
  useEffect(() => {
    async function load() {
      const res = await getScheduleForStaff(staff.id);
      setSchedule(res ?? []);
    }
    load();
  }, [staff.id]);

  // ✔ check if slot belongs to shift
  function isInsideSchedule(time: string) {
    if (!schedule || schedule.length === 0) return false;

    const weekday = DateTime.fromISO(date).weekday;
    const todays = schedule.filter((s) => s.dayOfWeek === weekday);
    if (todays.length === 0) return false;

    const [h, m] = time.split(":").map(Number);
    const mins = h * 60 + m;

    return todays.some((s) => {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);

      const start = sh * 60 + sm;
      const end = eh * 60 + em;

      return mins >= start && mins < end;
    });
  }

  // ⬇️ BUILD OFF-HOURS BLOCKS
  function buildOffHoursBlocks() {
    if (!schedule || schedule.length === 0) {
      return [{ start: 6 * 60, end: 24 * 60 }];
    }

    const weekday = DateTime.fromISO(date).weekday;
    const todays = schedule.filter((s) => s.dayOfWeek === weekday);

    if (todays.length === 0) {
      return [{ start: 6 * 60, end: 24 * 60 }];
    }

    const DAY_START = 6 * 60;
    const DAY_END = 24 * 60;

    const intervals = todays.map((s) => {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);
      return { start: sh * 60 + sm, end: eh * 60 + em };
    });

    intervals.sort((a, b) => a.start - b.start);

    const off: { start: number; end: number }[] = [];
    let prev = DAY_START;

    for (const i of intervals) {
      if (prev < i.start) off.push({ start: prev, end: i.start });
      prev = i.end;
    }

    if (prev < DAY_END) off.push({ start: prev, end: DAY_END });

    return off;
  }

  // ⬇️ CONVERT OFF-HOURS TO APPOINTMENT-LIKE ELEMENTS
  const offBlocks = buildOffHoursBlocks().map((b) => {
    const startISO = DateTime.fromISO(date).set({
      hour: Math.floor(b.start / 60),
      minute: b.start % 60,
    });

    const endISO = DateTime.fromISO(date).set({
      hour: Math.floor(b.end / 60),
      minute: b.end % 60,
    });

    return {
      id: `off-${staff.id}-${b.start}`,
      staffId: staff.id,
      startISO: startISO.toISO(),
      endISO: endISO.toISO(),
      startTime: startISO.toFormat("H:mm"),
      minutes: b.end - b.start,
      client: "",
      service: "Fuera de horario",
      isOffhours: true,
    };
  });

  return (
    <div className="flex-1 border-l relative h-full">
      {/* GRID */}
      <CalendarGrid
        timeSlots={timeSlots}
        staffId={staff.id}
        staffName={staff.name}
        onSlotClick={onSlotClick}
        selectedDate={date}
        isDisabled={(t) => !isInsideSchedule(t)}
      />

      {/* NORMAL APPOINTMENTS */}
      {appointments
        .filter((a) => a.staffId === staff.id)
        .map((a) => (
          <AppointmentItem
            key={a.id}
            a={a}
            startIdx={getTimeIndex(a.startTime)}
            isPast={false}
            isOngoing={false}
            onClick={() => openAppointmentById(a.id)}
          />
        ))}

      {/* ⬇️ OFF-HOURS APPOINTMENTS */}
      {offBlocks.map((a) => (
        <AppointmentItem key={a.id} a={a} OFF_HOURS />
      ))}
    </div>
  );
}
