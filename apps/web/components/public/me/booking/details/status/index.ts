import { BookingStatus } from "../booking-types";
import { BookingStatusConfig } from "./types";

import { confirmedStatus } from "./confirmed";
import { cancelledStatus } from "./cancelled";
import { completedStatus } from "./completed";

export const statusConfigMap: Record<BookingStatus, BookingStatusConfig> = {
  CONFIRMED: confirmedStatus,
  PENDING: confirmedStatus,
  CANCELLED: cancelledStatus,
  COMPLETED: completedStatus,
  NO_SHOW: cancelledStatus,
};