import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import {
  appointments,
  clients,
  paymentItems,
  payments,
  staff,
} from 'src/modules/db/schema';
import { calculatePaymentTotals } from './calculatePaymentTotal';
import { validatePayment } from './validatePayment';
import * as client from 'src/modules/db/client';
import { eq } from 'drizzle-orm';
import { ListPaymentsDto } from './dto/list-payments.dto';
import { and, gte, lte, desc, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';

@Injectable()
export class PaymentsService {
  constructor(@Inject('DB') private readonly db: client.DB) {}

  createPayment(dto: CreatePaymentDto) {
    validatePayment(dto);

    const totals = calculatePaymentTotals(dto.items);

    return this.db.transaction(async (tx) => {
      /* =====================
         CREATE PAYMENT
      ===================== */

      const [payment] = await tx

        .insert(payments)

        .values({
          organizationId: dto.organizationId,
          branchId: dto.branchId,

          clientId: dto.clientId ?? null,
          appointmentId: dto.appointmentId ?? null,

          cashierStaffId: dto.cashierStaffId,

          paymentMethod: dto.paymentMethod,
          paymentProvider: dto.paymentProvider,
          externalReference: dto.externalReference,

          status: 'paid',

          subtotalCents: totals.subtotalCents,
          discountsCents: totals.discountsCents,
          taxCents: totals.taxCents,
          totalCents: totals.totalCents,

          notes: dto.notes,
          paidAt: new Date(),
        })

        .returning();

      if (dto.appointmentId && payment.status === 'paid') {
        await tx
          .update(appointments)
          .set({ paymentStatus: 'PAID' })
          .where(eq(appointments.id, dto.appointmentId));
      }

      if (!payment) {
        throw new BadRequestException('Failed to create payment');
      }

      /* =====================
         INSERT ITEMS
      ===================== */
      const items = dto.items.map((item) => ({
        paymentId: payment.id,
        type: item.type,
        referenceId: item.referenceId,
        label: item.label,
        amountCents: item.amountCents,
        staffId: item.staffId,
        meta: item.meta,
      }));

      await tx.insert(paymentItems).values(items);

      return payment;
    });
  }

  async getPaymentById(id: string) {
    const payment = await this.db.query.payments.findFirst({
      where: eq(payments.id, id),
      with: {
        items: {
          orderBy: (items, { asc }) => [asc(items.createdAt)],
          with: {
            staff: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },

        client: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        appointment: {
          columns: {
            id: true,
            start: true,
            end: true,
            status: true,
          },
        },

        cashier: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!payment) {
      throw new BadRequestException('Payment not found');
    }

    return payment;
  }

  async listPayments(dto: ListPaymentsDto) {
    const {
      branchId,
      clientId,
      cashierStaffId,
      status,
      from,
      to,
      offset = 0,
      limit = 30,
    } = dto;

    const where = [eq(payments.branchId, branchId)];

    if (clientId) where.push(eq(payments.clientId, clientId));
    if (cashierStaffId) where.push(eq(payments.cashierStaffId, cashierStaffId));
    if (status) where.push(eq(payments.status, status));

    if (from) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const fromDate = DateTime.fromISO(from).startOf('day').toUTC();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      where.push(gte(payments.createdAt, fromDate.toJSDate()));
    }

    if (to) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      const toDate = DateTime.fromISO(to).endOf('day').toUTC();
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      where.push(lte(payments.createdAt, toDate.toJSDate()));
    }

    const [rows, [{ count }]] = await Promise.all([
      this.db
        .select({
          id: payments.id,
          createdAt: payments.createdAt,
          status: payments.status,
          paymentMethod: payments.paymentMethod,

          subtotalCents: payments.subtotalCents,
          discountsCents: payments.discountsCents,
          taxCents: payments.taxCents,
          totalCents: payments.totalCents,

          client: {
            id: clients.id,
            name: clients.name,
          },

          cashier: {
            id: staff.id,
            name: staff.name,
          },
        })
        .from(payments)
        .leftJoin(clients, eq(clients.id, payments.clientId))
        .leftJoin(staff, eq(staff.id, payments.cashierStaffId))
        .where(and(...where))
        .orderBy(desc(payments.createdAt))
        .limit(limit)
        .offset(offset),

      this.db
        .select({
          count: sql<number>`count(*)`,
        })
        .from(payments)
        .where(and(...where)),
    ]);

    return {
      total: Number(count),
      data: rows,
      limit,
      offset,
    };
  }
  async getPaymentByAppointmentId(appointmentId: string) {
    const payment = await this.db.query.payments.findFirst({
      where: eq(payments.appointmentId, appointmentId),
      with: {
        items: {
          orderBy: (items, { asc }) => [asc(items.createdAt)],
          with: {
            staff: {
              columns: {
                id: true,
                name: true,
              },
            },
          },
        },

        client: {
          columns: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },

        appointment: {
          columns: {
            id: true,
            start: true,
            end: true,
            status: true,
          },
        },

        cashier: {
          columns: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!payment) {
      return null; // 👈 importante: frontend decide qué hacer
    }

    return payment;
  }
}
