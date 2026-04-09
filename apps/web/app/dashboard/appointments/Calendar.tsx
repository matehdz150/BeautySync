"use client";

import { useRef } from "react";
import { DateTime } from "luxon";

import { useCurrentMinute } from "@/hooks/UseCurrentMinute";
import { TimeColumn } from "@/components/appointments/TimeColumn";
import { StaffColumn } from "@/components/appointments/StaffColumn";
import { AppointmentsHeader } from "@/components/appointments/PageComponents/AppointmentsHeader";
import { StaffStickyHeader } from "@/components/appointments/PageComponents/StaffStickyHeader";
import { NowLine } from "@/components/appointments/NowLine";
import { NewAppointmentSheet } from "@/components/appointments/PageComponents/NewAppointmentSheet/NewAppointmentSheet";

import { useCalendar, useCalendarActions } from "@/context/CalendarContext";
import AppointmentDetailSheet from "@/components/appointments/PageComponents/AppointmentDetailSheet/AppointmentDetailSheet";
import { EmptyStaffState } from "./EmptyState";
import SlotBookingSheet from "@/components/appointments/PageComponents/SlootBookingSheet/SlotBookingSheet";
import { StaffTimeOffSheet } from "@/components/appointments/PageComponents/StaffTimeOutSheet/StaffTimeOffSheet";
import { useBranch } from "@/context/BranchContext";
import { BlockDetailSheet } from "@/components/appointments/PageComponents/TimeOffDetailSheet/TimeOffDetailSheet";

const ROW_HEIGHT = 40;
const MINUTES_PER_SLOT = 30;

const timeSlots = Array.from({ length: (24 - 6) * 4 + 1 }, (_, i) => {
  const totalMinutes = 6 * 60 + i * 15;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}:${m.toString().padStart(2, "0")}`;
});

export default function Calendar() {
  const { state, dispatch, visibleStaff } = useCalendar();
  const { setDate, openNewAppointment } = useCalendarActions();
  const { branch } = useBranch();
  const branchId = branch?.id;

  const calendarRef = useRef<HTMLDivElement>(null);

  const now = useCurrentMinute();

  /* ---------- NOW LINE ---------- */

  const selectedDay = DateTime.fromISO(state.date);
  const nowLocal = now.setZone(selectedDay.zoneName ?? undefined);
  const isToday = nowLocal.hasSame(selectedDay, "day");

  const firstSlotMinutes = 6 * 60;
  const minutesToday = nowLocal.hour * 60 + nowLocal.minute;

  const showNowLine =
    isToday && minutesToday >= firstSlotMinutes && minutesToday <= 24 * 60;

  const nowTop =
    ((minutesToday - firstSlotMinutes) / MINUTES_PER_SLOT) * ROW_HEIGHT - 10;

  const hasStaff = state.staff.length > 0;

  return (
    <div className="mx-auto bg-white">
      <AppointmentsHeader
        date={state.date}
        onDateChange={setDate}
        dailyCounts={state.dailyCounts}
        todayCount={state.appointments.length}
        onNew={() => openNewAppointment()}
      />

      {/* ⛔️ EMPTY STATE */}
      {!hasStaff ? (
        <EmptyStaffState />
      ) : (
        <>
          <StaffStickyHeader staff={visibleStaff} top={72} />

          <div
            ref={calendarRef}
            className="overflow-y-auto overflow-x-hidden relative"
            style={{ height: "calc(70vh)" }}
          >
            <NowLine show={showNowLine} top={nowTop} />

            <div className="flex">
              <TimeColumn timeSlots={timeSlots} />

              {visibleStaff.map((s) => (
                <StaffColumn
                  key={s.id}
                  staff={s}
                  schedules={state.schedules[s.id] ?? []}
                  appointments={state.appointments}
                  timeSlots={timeSlots}
                  timeOffs={state.timeOffs}
                  date={state.date}
                />
              ))}
            </div>
          </div>


          <NewAppointmentSheet
            open={state.dialogOpen}
            onOpenChange={() => dispatch({ type: "CLOSE_SHEET" })}
            defaultStaffId={state.prefill.defaultStaffId}
            startISO={state.prefill.startISO}
            presetServices={state.prefill?.presetServices}
          />

            <StaffTimeOffSheet
              open={state.BlockDialogOpen}
              onOpenChange={() => dispatch({ type: "CLOSE_BLOCK_SHEET" })}
              branchId={branchId ?? ""}
              startISO={state.prefill?.startISO}
            />

            <BlockDetailSheet />

          <AppointmentDetailSheet />

          <SlotBookingSheet
            open={state.slotDialogOpen}
            onOpenChange={() => dispatch({ type: "CLOSE_SLOT_SHEET" })}
            pinnedStaffId={state.slotPrefill?.pinnedStaffId ?? null}
            pinnedStartIso={state.slotPrefill?.pinnedStartIso ?? null}
            pinnedStaffName={state.slotPrefill?.pinnedStaffName ?? null}
          />
        </>
      )}
    </div>
  );
}
