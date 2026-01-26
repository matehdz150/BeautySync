import { relations } from 'drizzle-orm';
import { staff } from './staff';
import { staffInvites } from './staffInvites';
import { staffSchedules } from './staffSchedules';
import { staffServices } from '../services';

export const staffRelations = relations(staff, ({ many }) => ({
  invites: many(staffInvites),
  schedules: many(staffSchedules),
  services: many(staffServices),
}));
