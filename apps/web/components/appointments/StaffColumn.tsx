"use client";

import { DateTime } from "luxon";
import { AppointmentItem } from "./AppointmentItem";
import { CalendarGrid } from "./CalendarGrid";
import { memo, useMemo } from "react";
import {
  useCalendarActions,
  type CalendarAppointment,
  type CalendarTimeOff,
} from "@/context/CalendarContext";
import { TimeOffItem } from "./TimeOffItem";
import { useBranch } from "@/context/BranchContext";
import { getStaffTimeOffDetail } from "@/lib/services/staff-time-off";
import { useTimeOffActions } from "@/context/TimeOffDraftContext";
import type { StaffSchedule } from "@/lib/services/staffSchedules";

type StaffColumnProps = {
  staff: {
    id: string;
    name: string;
  };
  schedules?: StaffSchedule[];
  appointments: CalendarAppointment[];
  timeSlots: string[];
  timeOffs: CalendarTimeOff[];
  date: string;
};

export const StaffColumn = memo(function StaffColumn({
  staff,
  schedules = [],
  appointments,
  timeSlots,
  timeOffs,
  date,
}: StaffColumnProps) {
  const getTimeIndex = (t: string) => timeSlots.indexOf(t);
  const { branch } = useBranch();
  const { loadFromTimeOff } = useTimeOffActions();
  const { openAppointmentById, openBlockTime } = useCalendarActions();

  const weekday = useMemo(() => DateTime.fromISO(date).weekday, [date]);
  const todaysSchedule = useMemo(
    () => schedules.filter((item) => item.dayOfWeek === weekday),
    [schedules, weekday],
  );
  const staffAppointments = useMemo(
    () => appointments.filter((appointment) => appointment.staffId === staff.id),
    [appointments, staff.id],
  );
  const staffTimeOffs = useMemo(
    () => timeOffs.filter((timeOff) => timeOff.staffId === staff.id),
    [timeOffs, staff.id],
  );

  // ✔ check if slot belongs to shift
  function isInsideSchedule(time: string) {
    if (todaysSchedule.length === 0) return false;

    const [h, m] = time.split(":").map(Number);
    const mins = h * 60 + m;

    return todaysSchedule.some((s) => {
      const [sh, sm] = s.startTime.split(":").map(Number);
      const [eh, em] = s.endTime.split(":").map(Number);

      const start = sh * 60 + sm;
      const end = eh * 60 + em;

      return mins >= start && mins < end;
    });
  }

  // ⬇️ BUILD OFF-HOURS BLOCKS
  const offBlocks = useMemo(() => {
    const DAY_START = 6 * 60;
    const DAY_END = 24 * 60;

    if (todaysSchedule.length === 0) {
      const startISO = DateTime.fromISO(date).set({
        hour: Math.floor(DAY_START / 60),
        minute: DAY_START % 60,
      });
      const endISO = DateTime.fromISO(date).set({
        hour: Math.floor(DAY_END / 60),
        minute: DAY_END % 60,
      });

      return [
        {
          id: `off-${staff.id}-${DAY_START}`,
          staffId: staff.id,
          startISO: startISO.toISO(),
          endISO: endISO.toISO(),
          startTime: startISO.toFormat("H:mm"),
          minutes: DAY_END - DAY_START,
          client: "",
          service: "Fuera de horario",
          isOffhours: true,
        },
      ];
    }

    const intervals =
      todaysSchedule.map((s) => {
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

    if (prev < DAY_END) {
      off.push({ start: prev, end: DAY_END });
    }

    return off.map((block) => {
      const startISO = DateTime.fromISO(date).set({
        hour: Math.floor(block.start / 60),
        minute: block.start % 60,
      });

      const endISO = DateTime.fromISO(date).set({
        hour: Math.floor(block.end / 60),
        minute: block.end % 60,
      });

      return {
        id: `off-${staff.id}-${block.start}`,
        staffId: staff.id,
        startISO: startISO.toISO(),
        endISO: endISO.toISO(),
        startTime: startISO.toFormat("H:mm"),
        minutes: block.end - block.start,
        client: "",
        service: "Fuera de horario",
        isOffhours: true,
      };
    });
  }, [date, staff.id, todaysSchedule]);

  return (
    <div className="flex-1 border-l relative h-full">
      {/* GRID */}
      <CalendarGrid
        timeSlots={timeSlots}
        staffId={staff.id}
        staffName={staff.name}
        selectedDate={date}
        isDisabled={(t) => !isInsideSchedule(t)}
      />

      {/* NORMAL APPOINTMENTS */}
      {staffAppointments.map((a) => (
        <AppointmentItem
          key={a.id}
          a={a}
          startIdx={getTimeIndex(a.startTime)}
          isPast={false}
          isOngoing={false}
          onClick={() => openAppointmentById(a.id)}
        />
      ))}

      {/* 🔥 TIME OFFS */}
      {staffTimeOffs.map((t) => (
        <TimeOffItem
          key={t.id}
          t={t}
          onClick={async () => {
            if (!branch?.id) return;

            try {
              const timeOffId = Number(
                t.id.toString().replace("timeoff-", ""),
              );
              const res = await getStaffTimeOffDetail({
                timeOffId,
                staffId: t.staffId,
                branchId: branch.id,
              });

              loadFromTimeOff(res);

              setTimeout(() => {
                openBlockTime();
              }, 0);
            } catch (e) {
              console.error(e);
            }
          }}
        />
      ))}

      {/* ⬇️ OFF-HOURS APPOINTMENTS */}
      {offBlocks.map((a) => (
        <AppointmentItem key={a.id} a={a} OFF_HOURS />
      ))}
    </div>
  );
});
