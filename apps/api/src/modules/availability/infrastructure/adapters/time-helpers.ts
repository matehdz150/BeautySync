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
 * Resta intervalos ocupados de bloques libres.
 */
export function subtractBusy(
  blocks: MinuteInterval[],
  busy: MinuteInterval[],
): MinuteInterval[] {
  let result = [...blocks];

  for (const b of busy) {
    const next: MinuteInterval[] = [];

    for (const block of result) {
      // no hay solape
      if (b.endMin <= block.startMin || b.startMin >= block.endMin) {
        next.push(block);
        continue;
      }

      // parte izquierda libre
      if (b.startMin > block.startMin) {
        next.push({
          startMin: block.startMin,
          endMin: b.startMin,
        });
      }

      // parte derecha libre
      if (b.endMin < block.endMin) {
        next.push({
          startMin: b.endMin,
          endMin: block.endMin,
        });
      }
    }

    result = next;
  }

  return result;
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