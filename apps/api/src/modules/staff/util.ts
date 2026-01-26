/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function resumirHorario(
  schedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[],
) {
  if (!schedules?.length) return 'Sin horario asignado';

  const sorted = schedules.sort((a, b) => a.dayOfWeek - b.dayOfWeek);

  const grupos: any[] = [];
  let actual: any = null;

  for (const s of sorted) {
    const clave = `${s.startTime}-${s.endTime}`;

    if (!actual) {
      actual = { clave, start: s.dayOfWeek, end: s.dayOfWeek, ...s };
      continue;
    }

    if (actual.clave === clave && s.dayOfWeek === actual.end + 1) {
      actual.end = s.dayOfWeek;
    } else {
      grupos.push(actual);
      actual = { clave, start: s.dayOfWeek, end: s.dayOfWeek, ...s };
    }
  }

  if (actual) grupos.push(actual);

  return grupos
    .map((g) => {
      const dias =
        g.start === g.end ? DIAS[g.start] : `${DIAS[g.start]}–${DIAS[g.end]}`;

      return `${dias}, ${g.startTime.slice(0, 5)}–${g.endTime.slice(0, 5)}`;
    })
    .join(' · ');
}
