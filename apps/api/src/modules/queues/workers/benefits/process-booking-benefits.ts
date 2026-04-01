import { db } from '../../../db/client';
import { benefitPrograms, benefitEarnRules } from '../../../db/schema';
import { eq } from 'drizzle-orm';

import { processBookingCountRule } from './process-booking-count-rule';
import { processFirstBookingRule } from './process-first-booking-rule';

export async function processBookingBenefits(input: {
  userId: string;
  branchId: string;
  bookingId: string;
  amountCents: number;
  isOnline: boolean;
}) {
  console.log('🎯 processBookingBenefits', input);

  // =========================
  // 1. programa activo
  // =========================
  const program = await db.query.benefitPrograms.findFirst({
    where: eq(benefitPrograms.branchId, input.branchId),
  });

  if (!program || !program.isActive) return;

  // =========================
  // 2. reglas activas
  // =========================
  const rules = await db.query.benefitEarnRules.findMany({
    where: eq(benefitEarnRules.programId, program.id),
  });

  if (!rules.length) return;

  // =========================
  // 3. ejecutar reglas
  // =========================
  for (const rule of rules) {
    switch (rule.type) {
      case 'BOOKING_COUNT':
        await processBookingCountRule({
          userId: input.userId,
          branchId: input.branchId,
          rule: {
            id: rule.id,
            config: rule.config as {
              count: number;
              points: number;
            },
          },
          context: {
            bookingId: input.bookingId,
          },
        });
        break;

      case 'FIRST_BOOKING':
        await processFirstBookingRule({
          userId: input.userId,
          branchId: input.branchId,
          rule: {
            id: rule.id,
            config: rule.config as {
              points: number;
            },
          },
          context: {
            bookingId: input.bookingId,
          },
        });
        break;

      // 👉 opcional: puedes duplicar lógica aquí o dejarlo solo en payment worker
      case 'ONLINE_PAYMENT':
        if (!input.isOnline) continue;

        // podrías delegar a paymentBenefits o hacer lógica directa
        break;

      case 'SPEND_ACCUMULATED':
        // esto idealmente va en payment worker
        break;

      default:
        console.warn('⚠️ Unknown rule type', rule.type);
    }
  }
}
