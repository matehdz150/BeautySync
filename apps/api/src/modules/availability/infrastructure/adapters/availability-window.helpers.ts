import { DateTime } from 'luxon';

type AvailabilityWindow = {
  start: DateTime;
  end: DateTime;
  startDate: string;
  endDate: string;
};

function toIsoDate(value: DateTime, message: string): string {
  const isoDate = value.toISODate();
  if (!isoDate) {
    throw new Error(message);
  }

  return isoDate;
}

export function getAvailabilityWindowForDate(date: string): AvailabilityWindow {
  const anchorDate = DateTime.fromISO(date).startOf('day');
  if (!anchorDate.isValid) {
    throw new Error(`Invalid availability date: ${date}`);
  }

  const start = anchorDate.startOf('month');
  const end = anchorDate.endOf('month');

  return {
    start,
    end,
    startDate: toIsoDate(
      start,
      `Invalid availability window start for ${date}`,
    ),
    endDate: toIsoDate(end, `Invalid availability window end for ${date}`),
  };
}

export function getAvailabilityWindowsForRange(params: {
  start: string;
  end: string;
}): AvailabilityWindow[] {
  const normalizedStart = DateTime.fromISO(params.start).startOf('day');
  const normalizedEnd = DateTime.fromISO(params.end).startOf('day');

  if (!normalizedStart.isValid || !normalizedEnd.isValid) {
    throw new Error(
      `Invalid availability range: ${params.start} -> ${params.end}`,
    );
  }

  if (normalizedEnd < normalizedStart) {
    return [];
  }

  const windows: AvailabilityWindow[] = [];
  let cursor = normalizedStart.startOf('month');
  const lastMonth = normalizedEnd.startOf('month');

  while (cursor <= lastMonth) {
    const start = cursor.startOf('month');
    const end = cursor.endOf('month');

    windows.push({
      start,
      end,
      startDate: toIsoDate(
        start,
        `Invalid availability range start for ${params.start}`,
      ),
      endDate: toIsoDate(
        end,
        `Invalid availability range end for ${params.end}`,
      ),
    });

    cursor = cursor.plus({ months: 1 });
  }

  return windows;
}
