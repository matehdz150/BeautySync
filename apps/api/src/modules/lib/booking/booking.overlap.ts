/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { and, eq, gt, lt, inArray } from 'drizzle-orm';
import { DateTime } from 'luxon';
import { appointments } from 'src/modules/db/schema';
import { BLOCKING_APPOINTMENT_STATUSES } from './booking.constants';

export function buildAppointmentOverlapWhere(params: {
  branchId: string;
  staffId: string;
  startUtc: DateTime;
  endUtc: DateTime;
}) {
  const { branchId, staffId, startUtc, endUtc } = params;

  return and(
    eq(appointments.branchId, branchId),
    eq(appointments.staffId, staffId),
    lt(appointments.start, endUtc.toJSDate()),
    gt(appointments.end, startUtc.toJSDate()),
    inArray(appointments.status, BLOCKING_APPOINTMENT_STATUSES as any),
  );
}
