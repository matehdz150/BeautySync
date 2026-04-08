import { DateTime } from 'luxon';

export type MinuteInterval = { startMin: number; endMin: number };

export function parseTimeToMinutes(time: string): number {
  // soporta "HH:mm" o "HH:mm:ss"
  const [h, m] = time.split(':').map(Number);
  return h * 60 + (m || 0);
}

/**
 * Convierte DateTime a minutos desde el inicio del día local.
 * Clampea a [0, 1440].
 */
export function dtToMinutesSinceDayStart(
  dt: DateTime,
  dayStart: DateTime,
): number {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
  const diffMin = Math.round(dt.diff(dayStart, 'minutes').minutes);
  return Math.max(0, Math.min(1440, diffMin));
}

/**
 * Check overlap between intervals [start, end).
 */
export function overlaps(a: MinuteInterval, b: MinuteInterval): boolean {
  return a.startMin < b.endMin && b.startMin < a.endMin;
}

/**
 * Merge touching or overlapping intervals in O(n log n).
 */
export function mergeIntervals(intervals: MinuteInterval[]): MinuteInterval[] {
  if (intervals.length <= 1) return [...intervals];

  const sorted = [...intervals].sort((a, b) => a.startMin - b.startMin);
  const merged: MinuteInterval[] = [];

  let current = { ...sorted[0] };
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];

    if (next.startMin <= current.endMin) {
      current.endMin = Math.max(current.endMin, next.endMin);
      continue;
    }

    merged.push(current);
    current = { ...next };
  }

  merged.push(current);
  return merged;
}

/**
 * Subtract exclusions from base intervals in O((b + e) log(b + e)).
 */
export function subtractIntervals(
  baseIntervals: MinuteInterval[],
  exclusions: MinuteInterval[],
): MinuteInterval[] {
  if (!baseIntervals.length) return [];
  if (!exclusions.length) return mergeIntervals(baseIntervals);

  const base = mergeIntervals(baseIntervals);
  const exclude = mergeIntervals(exclusions);

  const result: MinuteInterval[] = [];
  let exclusionIdx = 0;

  for (const interval of base) {
    let cursor = interval.startMin;

    while (exclusionIdx < exclude.length && exclude[exclusionIdx].endMin <= cursor) {
      exclusionIdx++;
    }

    let scan = exclusionIdx;
    while (scan < exclude.length && exclude[scan].startMin < interval.endMin) {
      const ex = exclude[scan];

      if (!overlaps({ startMin: cursor, endMin: interval.endMin }, ex)) {
        scan++;
        continue;
      }

      if (ex.startMin > cursor) {
        result.push({
          startMin: cursor,
          endMin: Math.min(ex.startMin, interval.endMin),
        });
      }

      cursor = Math.max(cursor, ex.endMin);
      if (cursor >= interval.endMin) {
        break;
      }

      scan++;
    }

    if (cursor < interval.endMin) {
      result.push({
        startMin: cursor,
        endMin: interval.endMin,
      });
    }
  }

  return result;
}

/**
 * Backward-compatible alias used across the module.
 */
export function subtractBusy(
  blocks: MinuteInterval[],
  busy: MinuteInterval[],
): MinuteInterval[] {
  return subtractIntervals(blocks, busy);
}

/**
 * A partir de bloques libres y duración, genera slots de inicio (minutos).
 */
const SLOT_MIN = 30;

export function splitIntoSlots(
  freeBlocks: MinuteInterval[],
  slotDurationMin: number,
): number[] {
  const slots: number[] = [];

  for (const block of freeBlocks) {
    let cursor = block.startMin;

    // avances SIEMPRE en bloques de 30 min
    while (cursor + slotDurationMin <= block.endMin) {
      // si desde aquí cabe completo → es válido
      slots.push(cursor);

      cursor += SLOT_MIN;
    }
  }

  return slots;
}
