import { DateTime } from "luxon";
import { TimeOffDraft } from "@/context/TimeOffDraftContext";

export function buildTimeOffPayload(state: TimeOffDraft) {
  if (state.mode === "SINGLE") {
    const start = DateTime.fromISO(`${state.date}T${state.startTime}`);
    const end = DateTime.fromISO(`${state.date}T${state.endTime}`);

    if (!start.isValid || !end.isValid) {
      throw new Error("INVALID_DATETIME");
    }

    if (end <= start) {
      throw new Error("INVALID_RANGE");
    }

    return {
      staffId: state.staffId,
      start: start.toISO(),
      end: end.toISO(),
      reason: state.reason || undefined,
    };
  }

  // RECURRING

  const start = DateTime.fromISO(`${state.startDate}T${state.startTime}`);
  const end = DateTime.fromISO(`${state.startDate}T${state.endTime}`);

  if (!start.isValid || !end.isValid) {
    throw new Error("INVALID_TIME");
  }

  if (end <= start) {
    throw new Error("INVALID_RANGE");
  }

  if (state.recurrenceType === "WEEKLY" && state.daysOfWeek.length === 0) {
    throw new Error("NO_DAYS_SELECTED");
  }

  return {
    staffId: state.staffId,
    reason: state.reason || undefined,
    rule: {
      recurrenceType: state.recurrenceType,
      daysOfWeek:
        state.recurrenceType === "WEEKLY"
          ? state.daysOfWeek
          : undefined,
      startTime: state.startTime,
      endTime: state.endTime,
      startDate: state.startDate,
      endDate: state.endDate,
    },
  };
}