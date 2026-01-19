/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq, and, lt, gt, inArray } from 'drizzle-orm';
import * as client from 'src/db/client';
import {
  appointments,
  appointmentStatusHistory,
  branches,
  branchSettings,
  clients,
  publicUserClients,
  publicUsers,
  serviceCategories,
  services,
  staff,
  staffServices,
} from 'src/db/schema';
import { DateTime } from 'luxon';
import { AvailabilityService } from '../availability/availability.service';
import { CreatePublicBookingDto } from './dto/create-booking-public.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class PublicService {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly availabilityService: AvailabilityService,
  ) {}
  async getServicesByBranchSlug(slug: string) {
    if (!slug) throw new NotFoundException('Branch not found');

    // 1️⃣ Buscar branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 2️⃣ Servicios públicos activos
    const rows = await this.db
      .select({
        id: services.id,
        name: services.name,
        durationMin: services.durationMin,
        priceCents: services.priceCents,

        category: {
          id: serviceCategories.id,
          name: serviceCategories.name,
          icon: serviceCategories.icon,
          hexColor: serviceCategories.colorHex,
        },
      })
      .from(services)
      .leftJoin(
        serviceCategories,
        eq(serviceCategories.id, services.categoryId),
      )
      .where(and(eq(services.branchId, branch.id), eq(services.isActive, true)))
      .orderBy(services.name);

    // 3️⃣ Normalizar categoría null
    return rows.map((s) => ({
      id: s.id,
      name: s.name,
      durationMin: s.durationMin,
      priceCents: s.priceCents,
      category: s.category?.id ? s.category : null,
    }));
  }

  async getStaffForService({
    slug,
    serviceId,
  }: {
    slug: string;
    serviceId: string;
  }) {
    // 1️⃣ Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 2️⃣ Service belongs to branch
    const service = await this.db.query.services.findFirst({
      where: and(
        eq(services.id, serviceId),
        eq(services.branchId, branch.id),
        eq(services.isActive, true),
      ),
    });

    if (!service) {
      throw new BadRequestException('Invalid service for this branch');
    }

    // 3️⃣ Staff elegible
    const rows = await this.db
      .select({
        id: staff.id,
        name: staff.name,
        avatarUrl: staff.avatarUrl,
      })
      .from(staffServices)
      .innerJoin(
        staff,
        and(
          eq(staff.id, staffServices.staffId),
          eq(staff.branchId, branch.id),
          eq(staff.isActive, true),
        ),
      )
      .where(eq(staffServices.serviceId, serviceId))
      .orderBy(staff.name);

    return rows;
  }

  async getAvailableDates({
    slug,
    requiredDurationMin,
    staffId,
    month,
  }: {
    slug: string;
    requiredDurationMin: number;
    staffId?: string;
    month?: string; // YYYY-MM
  }): Promise<{ date: string; available: boolean }[]> {
    // 1️⃣ Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 2️⃣ Resolver mes
    const base = month ? DateTime.fromFormat(month, 'yyyy-MM') : DateTime.now();

    const start = base.startOf('month');
    const end = base.endOf('month');

    const days: { date: string; available: boolean }[] = [];

    // 🔒 Hard limit defensivo
    const MAX_DAYS = 31;
    let cursor = start;
    let count = 0;

    while (cursor <= end && count < MAX_DAYS) {
      const dateIso = cursor.toISODate()!;

      try {
        const availability = await this.availabilityService.getAvailability({
          branchId: branch.id,
          requiredDurationMin,
          staffId,
          date: dateIso,
        });

        const hasSlots = availability.staff.some(
          (staff) => staff.slots.length > 0,
        );

        days.push({
          date: dateIso,
          available: hasSlots,
        });
      } catch {
        days.push({
          date: dateIso,
          available: false,
        });
      }

      cursor = cursor.plus({ days: 1 });
      count++;
    }

    return days;
  }

  async getAvailableTimes({
    slug,
    serviceId,
    requiredDurationMin,
    date,
    staffId,
  }: {
    slug: string;
    serviceId?: string;
    requiredDurationMin?: number;
    date: string;
    staffId?: string;
  }) {
    // 1️⃣ Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) {
      throw new NotFoundException('Branch not found');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 2️⃣ Validación de modo
    const isByService = typeof serviceId === 'string';
    const isByDuration = typeof requiredDurationMin === 'number';

    if (!isByService && !isByDuration) {
      throw new BadRequestException(
        'serviceId or requiredDurationMin is required',
      );
    }

    if (isByService && isByDuration) {
      throw new BadRequestException(
        'Use either serviceId OR requiredDurationMin, not both',
      );
    }

    // 3️⃣ Reusar motor único de disponibilidad
    const availability = await this.availabilityService.getAvailability({
      branchId: branch.id,
      serviceId: isByService ? serviceId : undefined,
      requiredDurationMin: isByDuration ? requiredDurationMin : undefined,
      staffId,
      date,
    });

    // 4️⃣ Respuesta pública limpia
    return availability.staff.map((s) => ({
      staffId: s.staffId,
      slots: s.slots, // ISO UTC
    }));
  }

  async getAvailableTimesChain({
    slug,
    date,
    chain,
  }: {
    slug: string;
    date: string; // YYYY-MM-DD
    // eslint-disable-next-line @typescript-eslint/no-redundant-type-constituents
    chain: { serviceId: string; staffId: string | 'ANY' }[];
  }) {
    if (!chain.length) {
      throw new BadRequestException('Chain is required');
    }

    // 1️⃣ Branch
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled)
      throw new ForbiddenException('Branch is not public');

    const branchId = branch.id;

    // =====================
    // TIMEZONE CONSTANT (CHANGE HERE)
    // =====================
    const BRANCH_TZ = 'America/Mexico_City';

    // =====================
    // TYPES (PLAN)
    // =====================

    type ChainAssignment = {
      serviceId: string;
      staffId: string;

      // UTC (source of truth)
      startIso: string;
      endIso: string;

      // Local timezone (for UI)
      startLocalIso: string;
      endLocalIso: string;

      durationMin: number;
    };

    type ChainPlan = {
      // UTC (source of truth)
      startIso: string;

      // Local timezone (for UI)
      startLocalIso: string;
      startLocalLabel: string; // "10:00"

      assignments: ChainAssignment[];
    };

    // =====================
    // HELPERS
    // =====================

    const STEP_MIN = 15;

    function ceilToStepIso(isoUtc: string, stepMin = STEP_MIN) {
      const dt = DateTime.fromISO(isoUtc, { zone: 'utc' });

      const minutes = dt.minute;
      const remainder = minutes % stepMin;

      if (remainder === 0 && dt.second === 0 && dt.millisecond === 0) {
        return dt.toUTC().toISO()!;
      }

      const add = stepMin - remainder;

      return dt.plus({ minutes: add }).startOf('minute').toUTC().toISO()!;
    }

    function buildSlotSet(slots: string[]) {
      return new Set(slots);
    }

    function isSameLocalDay(dateStr: string) {
      // dateStr = "YYYY-MM-DD"
      const target = DateTime.fromISO(dateStr, { zone: BRANCH_TZ }).startOf(
        'day',
      );
      const nowLocal = DateTime.now().setZone(BRANCH_TZ).startOf('day');
      return target.toISODate() === nowLocal.toISODate();
    }

    function minStartForDateUtc({
      date,
      stepMin = STEP_MIN,
      noticeMin = 0,
    }: {
      date: string;
      stepMin?: number;
      noticeMin?: number;
    }) {
      // Si no es hoy, no hay restricción por "hora actual"
      if (!isSameLocalDay(date)) return null;

      // now en UTC + notice
      const minUtc = DateTime.now()
        .toUTC()
        .plus({ minutes: noticeMin })
        .startOf('minute')
        .toISO()!;

      // redondear hacia arriba a step (15m)
      return ceilToStepIso(minUtc, stepMin);
    }

    function addMinutesIso(isoUtc: string, minutes: number) {
      return DateTime.fromISO(isoUtc, { zone: 'utc' })
        .plus({ minutes })
        .toUTC()
        .toISO()!;
    }

    function toLocalIso(utcIso: string) {
      return DateTime.fromISO(utcIso, { zone: 'utc' })
        .setZone(BRANCH_TZ)
        .toISO()!;
    }

    function toLocalLabel(utcIso: string) {
      return DateTime.fromISO(utcIso, { zone: 'utc' })
        .setZone(BRANCH_TZ)
        .toFormat('HH:mm');
    }

    function canCoverDuration({
      slotSet,
      startIso,
      durationMin,
      stepMin = STEP_MIN,
    }: {
      slotSet: Set<string>;
      startIso: string;
      durationMin: number;
      stepMin?: number;
    }) {
      if (durationMin <= 0) return true;

      const neededSteps = Math.ceil(durationMin / stepMin);

      for (let i = 0; i < neededSteps; i++) {
        const t = addMinutesIso(startIso, i * stepMin);
        if (!slotSet.has(t)) return false;
      }

      return true;
    }

    // =====================
    // 2️⃣ Load durations for each service
    // =====================

    const durationByService = new Map<string, number>();

    for (const step of chain) {
      if (durationByService.has(step.serviceId)) continue;

      const service = await this.db.query.services.findFirst({
        where: and(
          eq(services.id, step.serviceId),
          eq(services.branchId, branchId),
          eq(services.isActive, true),
        ),
      });

      if (!service?.durationMin) {
        throw new BadRequestException(
          `Invalid service in chain: ${step.serviceId}`,
        );
      }

      durationByService.set(step.serviceId, service.durationMin);
    }

    // =====================
    // 3️⃣ Cache: staff slots (availability)
    // =====================

    const staffSlotsCache = new Map<string, Set<string>>();

    const getStaffSlotSet = async (staffId: string): Promise<Set<string>> => {
      const cached = staffSlotsCache.get(staffId);
      if (cached) return cached;

      const availability = await this.availabilityService.getAvailability({
        branchId,
        staffId,
        date,
        requiredDurationMin: 0,
      });

      const staffRow = availability.staff.find((s) => s.staffId === staffId);
      const set = buildSlotSet(staffRow?.slots ?? []);

      staffSlotsCache.set(staffId, set);
      return set;
    };

    // =====================
    // 4️⃣ Cache: eligible staff for service (for ANY)
    // =====================

    const eligibleStaffByService = new Map<string, string[]>();

    const getEligibleStaffForService = async (
      serviceId: string,
    ): Promise<string[]> => {
      const cached = eligibleStaffByService.get(serviceId);
      if (cached) return cached;

      const rows = await this.db
        .select({
          staffId: staffServices.staffId,
        })
        .from(staffServices)
        .innerJoin(
          staff,
          and(
            eq(staff.id, staffServices.staffId),
            eq(staff.branchId, branchId),
            eq(staff.isActive, true),
          ),
        )
        .where(eq(staffServices.serviceId, serviceId));

      const list = rows.map((r) => r.staffId);

      eligibleStaffByService.set(serviceId, list);
      return list;
    };

    // =====================
    // 5️⃣ Build step candidates
    // =====================

    type StepCandidate = {
      serviceId: string;
      durationMin: number;
      candidates: string[]; // staffIds
    };

    const steps: StepCandidate[] = [];

    for (const step of chain) {
      const durationMin = durationByService.get(step.serviceId)!;

      if (step.staffId !== 'ANY') {
        steps.push({
          serviceId: step.serviceId,
          durationMin,
          candidates: [step.staffId],
        });
        continue;
      }

      const eligibleStaff = await getEligibleStaffForService(step.serviceId);

      steps.push({
        serviceId: step.serviceId,
        durationMin,
        candidates: eligibleStaff,
      });
    }

    if (steps.some((s) => s.candidates.length === 0)) {
      return [];
    }

    // =====================
    // 6️⃣ BaseStartTimes (union from step 0 candidates)
    // =====================

    const baseStartTimes = new Set<string>();

    {
      const first = steps[0];

      for (const staffId of first.candidates) {
        const slotSet = await getStaffSlotSet(staffId);
        for (const slotIso of slotSet) {
          baseStartTimes.add(slotIso);
        }
      }
    }

    if (!baseStartTimes.size) return [];

    const minBookingNoticeMin = 0;

    const minStartUtc = minStartForDateUtc({
      date,
      stepMin: STEP_MIN,
      noticeMin: minBookingNoticeMin,
    });

    if (minStartUtc) {
      for (const slotIso of Array.from(baseStartTimes)) {
        // slotIso está en UTC ISO
        if (slotIso < minStartUtc) {
          baseStartTimes.delete(slotIso);
        }
      }
    }

    if (!baseStartTimes.size) return [];

    // =====================
    // 7️⃣ Backtracking solver that RETURNS assignments
    // =====================

    const memoFail = new Set<string>();

    const solveFrom = async (
      stepIndex: number,
      cursorIso: string,
    ): Promise<ChainAssignment[] | null> => {
      if (stepIndex >= steps.length) return [];

      const memoKey = `${stepIndex}|${cursorIso}`;
      if (memoFail.has(memoKey)) return null;

      const step = steps[stepIndex];

      for (const staffId of step.candidates) {
        const slotSet = await getStaffSlotSet(staffId);

        const ok = canCoverDuration({
          slotSet,
          startIso: cursorIso,
          durationMin: step.durationMin,
        });

        if (!ok) continue;

        const endIso = addMinutesIso(cursorIso, step.durationMin);

        // 🔥 Opción C: redondear hacia arriba el inicio del siguiente servicio
        const nextCursorIso = ceilToStepIso(endIso, STEP_MIN);

        const next = await solveFrom(stepIndex + 1, nextCursorIso);

        if (next) {
          const current: ChainAssignment = {
            serviceId: step.serviceId,
            staffId,

            startIso: cursorIso,
            endIso,

            startLocalIso: toLocalIso(cursorIso),
            endLocalIso: toLocalIso(endIso),

            durationMin: step.durationMin,
          };

          return [current, ...next];
        }
      }

      memoFail.add(memoKey);
      return null;
    };

    // =====================
    // 8️⃣ Evaluate all startIso -> build plans
    // =====================

    const plans: ChainPlan[] = [];

    for (const startIso of baseStartTimes) {
      const normalized = DateTime.fromISO(startIso, { zone: 'utc' })
        .toUTC()
        .toISO()!;

      const assignments = await solveFrom(0, normalized);

      if (assignments?.length) {
        plans.push({
          startIso: normalized,
          startLocalIso: toLocalIso(normalized),
          startLocalLabel: toLocalLabel(normalized),
          assignments,
        });
      }
    }

    plans.sort((a, b) => a.startIso.localeCompare(b.startIso));

    return plans;
  }

  async createPublicBooking(dto: CreatePublicBookingDto, publicUserId: string) {
    async function getOrCreateClientForPublicUser(params: {
      tx: any; // drizzle tx
      publicUser: typeof publicUsers.$inferSelect;
      branch: typeof branches.$inferSelect;
    }) {
      const { tx, publicUser, branch } = params;

      // 1) buscar si ya hay client ligado a este publicUser EN ESTA ORG
      const existingLink = await tx.query.publicUserClients.findFirst({
        where: eq(publicUserClients.publicUserId, publicUser.id),
        with: {
          client: true,
        },
      });

      // OJO: eso trae cualquier client, pero tú necesitas que sea de la misma org
      if (existingLink?.client?.organizationId === branch.organizationId) {
        return existingLink.client.id;
      }

      // 2) si no hay link válido para esta org, creamos client
      const [createdClient] = await tx
        .insert(clients)
        .values({
          organizationId: branch.organizationId,
          name: publicUser.name ?? 'Cliente',
          email: publicUser.email ?? null,
          phone: publicUser.phoneE164 ?? null,
          avatarUrl: publicUser.avatarUrl ?? null,
        })
        .returning({ id: clients.id });

      // 3) ligamos publicUser <-> client
      await tx.insert(publicUserClients).values({
        publicUserId: publicUser.id,
        clientId: createdClient.id,
      });

      return createdClient.id;
    }
    const { branchSlug, appointments: drafts } = dto;

    if (!drafts?.length) {
      throw new BadRequestException('appointments is required');
    }

    const publicUser = await this.db.query.publicUsers.findFirst({
      where: eq(publicUsers.id, publicUserId),
    });

    if (!publicUser) {
      throw new ForbiddenException('Public user not found');
    }

    if (!publicUser.phoneE164 || publicUser.phoneE164.trim().length < 8) {
      // 🔥 aquí lo bloqueas
      throw new ForbiddenException({
        code: 'PHONE_REQUIRED',
        message: 'Phone number is required to create an appointment',
      });
    }

    // 1) branch por slug
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, branchSlug),
    });

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled)
      throw new ForbiddenException('Branch is not public');

    // 2) settings (timezone + buffers)
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';
    const bufferBefore = settings?.bufferBeforeMin ?? 0;
    const bufferAfter = settings?.bufferAfterMin ?? 0;

    const BLOCK_MINUTES = 15;

    // 3) Validación rápida: staffId no puede ser ANY aquí
    if (drafts.some((a) => a.staffId === 'ANY')) {
      throw new BadRequestException(
        'staffId cannot be ANY in final booking payload',
      );
    }

    // ✅ bookingId para agrupar TODO
    const bookingId = randomUUID();

    // 4) Construimos appointments "reales" (start/end UTC)
    const normalized = await Promise.all(
      drafts.map(async (a) => {
        const service = await this.db.query.services.findFirst({
          where: and(
            eq(services.id, a.serviceId),
            eq(services.branchId, branch.id),
            eq(services.isActive, true),
          ),
        });

        if (!service) {
          throw new BadRequestException(`Service not found: ${a.serviceId}`);
        }

        // start viene en local ISO con offset (-06:00), lo parseamos respetando offset
        const startLocal = DateTime.fromISO(a.startIso).set({
          millisecond: 0,
          second: 0,
        });

        if (!startLocal.isValid) {
          throw new BadRequestException('Invalid startIso');
        }

        // Validación: debe pertenecer al date del payload (en TZ del branch)
        const startInBranchTz = startLocal.setZone(tz);
        if (startInBranchTz.toISODate() !== dto.date) {
          throw new BadRequestException(
            `startIso does not match date ${dto.date}`,
          );
        }

        // duración real con buffers
        const totalMinutes = service.durationMin + bufferBefore + bufferAfter;
        const roundedMinutes =
          Math.ceil(totalMinutes / BLOCK_MINUTES) * BLOCK_MINUTES;

        // convertimos a UTC (source of truth)
        const startUtc = startLocal.toUTC();
        const endUtc = startUtc.plus({ minutes: roundedMinutes }).set({
          millisecond: 0,
          second: 0,
        });

        return {
          publicBookingId: bookingId, // ✅
          branchId: branch.id,
          serviceId: service.id,
          staffId: a.staffId,
          startUtc,
          endUtc,
          priceCents: service.priceCents,
          notes: dto.notes ?? null,
        };
      }),
    );

    // 5) Ordenar por start (por si vienen desordenados)
    normalized.sort((x, y) =>
      x.startUtc.toISO()!.localeCompare(y.startUtc.toISO()),
    );

    // 6) Validación: deben ser consecutivos (chain)
    for (let i = 1; i < normalized.length; i++) {
      const prev = normalized[i - 1];
      const curr = normalized[i];

      if (prev.endUtc.toISO() !== curr.startUtc.toISO()) {
        throw new BadRequestException(
          'appointments must be consecutive without gaps',
        );
      }
    }

    // 7) Transacción + overlap defense
    return this.db.transaction(async (tx) => {
      // 🔥 7.1 resolver clientId para esta organización
      const clientId = await getOrCreateClientForPublicUser({
        tx,
        publicUser,
        branch,
      });

      // 7.2 overlap defense igual
      for (const a of normalized) {
        const overlapping = await tx
          .select()
          .from(appointments)
          .where(
            and(
              eq(appointments.branchId, a.branchId),
              eq(appointments.staffId, a.staffId),
              lt(appointments.start, a.endUtc.toJSDate()),
              gt(appointments.end, a.startUtc.toJSDate()),
            ),
          );

        if (overlapping.length > 0) {
          throw new BadRequestException('Timeslot already booked');
        }
      }

      // 7.3 crear appointments YA ligados
      const created = await Promise.all(
        normalized.map(async (a) => {
          const [row] = await tx
            .insert(appointments)
            .values({
              publicBookingId: a.publicBookingId,
              publicUserId,
              clientId, // ✅ YA NO NULL
              branchId: a.branchId,
              staffId: a.staffId,
              serviceId: a.serviceId,
              start: a.startUtc.toJSDate(),
              end: a.endUtc.toJSDate(),
              status: 'CONFIRMED',
              paymentStatus: dto.paymentMethod === 'ONLINE' ? 'PAID' : 'UNPAID',
              notes: a.notes,
              priceCents: a.priceCents,
            })
            .returning();

          await tx.insert(appointmentStatusHistory).values({
            appointmentId: row.id,
            newStatus: 'CONFIRMED',
            reason: 'Public booking',
          });

          return row;
        }),
      );

      return {
        ok: true,
        bookingId,
        branchSlug: dto.branchSlug,
        date: dto.date,
        paymentMethod: dto.paymentMethod,
        discountCode: dto.discountCode ?? null,
        notes: dto.notes ?? null,
        clientId, // 🔥 útil para el front
        appointments: created,
      };
    });
  }

  async getPublicBookingById(params: {
    bookingId: string;
    publicUserId: string;
  }) {
    const { bookingId, publicUserId } = params;

    if (!bookingId) throw new BadRequestException('bookingId is required');
    if (!publicUserId) throw new ForbiddenException('Not authenticated');

    // 1) Buscar appointment(s) por publicBookingId
    const rows = await this.db.query.appointments.findMany({
      where: eq(appointments.publicBookingId, bookingId),
    });

    if (!rows.length) {
      throw new NotFoundException('Booking not found');
    }

    if (rows.some((r) => r.publicUserId !== publicUserId)) {
      throw new NotFoundException('Booking not found');
    }

    // 2) branch
    const branchId = rows[0].branchId;

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
      with: {
        images: true,
      },
    });

    if (!branch) throw new NotFoundException('Branch not found');
    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Branch is not public');
    }

    // 3) settings (timezone)
    const settings = await this.db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branch.id),
    });

    const tz = settings?.timezone ?? 'America/Mexico_City';

    // 4) cargar services y staff de los appointments
    const serviceIds = Array.from(new Set(rows.map((r) => r.serviceId)));
    const staffIds = Array.from(new Set(rows.map((r) => r.staffId)));

    const servicesRows = await this.db.query.services.findMany({
      where: inArray(services.id, serviceIds),
    });

    const staffRows = await this.db.query.staff.findMany({
      where: inArray(staff.id, staffIds),
    });

    const servicesMap = new Map(servicesRows.map((s) => [s.id, s]));
    const staffMap = new Map(staffRows.map((s) => [s.id, s]));

    // 5) ordenar por start
    const ordered = [...rows].sort((a, b) => {
      const aIso = new Date(a.start).toISOString();
      const bIso = new Date(b.start).toISOString();
      return aIso.localeCompare(bIso);
    });

    // 6) construir response appointments (con ISO local en tz)
    const appointmentPayload = ordered.map((a) => {
      const srv = servicesMap.get(a.serviceId);
      const st = staffMap.get(a.staffId);

      const startUtc = DateTime.fromJSDate(a.start, { zone: 'utc' });
      const endUtc = DateTime.fromJSDate(a.end, { zone: 'utc' });

      return {
        id: a.id,

        startIso: startUtc.setZone(tz).toISO()!,
        endIso: endUtc.setZone(tz).toISO()!,

        durationMin: Math.round(endUtc.diff(startUtc, 'minutes').minutes),

        priceCents: a.priceCents ?? srv?.priceCents ?? 0,

        service: {
          id: srv?.id ?? a.serviceId,
          name: srv?.name ?? 'Servicio',
        },

        staff: st
          ? {
              id: st.id,
              name: st.name,
              avatarUrl: st.avatarUrl ?? null,
            }
          : {
              id: a.staffId,
              name: a.staffId,
              avatarUrl: null,
            },
      };
    });

    // 7) total + date (date local en tz del primer appointment)
    const totalCents = appointmentPayload.reduce(
      (acc, x) => acc + (x.priceCents ?? 0),
      0,
    );

    const firstStart = DateTime.fromJSDate(ordered[0].start, { zone: 'utc' })
      .setZone(tz)
      .toISODate();

    // 8) paymentMethod: si hay alguno PAID -> ONLINE, si no ONSITE
    // (puedes ajustar lógica si quieres)
    const paymentMethod = ordered.some((a) => a.paymentStatus === 'PAID')
      ? 'ONLINE'
      : 'ONSITE';

    const coverUrl =
      branch.images?.find((img) => img.isCover)?.url ??
      branch.images?.[0]?.url ??
      null;

    return {
      ok: true,
      booking: {
        id: bookingId,

        branch: {
          slug: branch.publicSlug,
          name: branch.name,
          address: branch.address ?? '',
          imageUrl: coverUrl,
        },

        date: firstStart,
        paymentMethod,
        notes: ordered[0].notes ?? null,

        totalCents,
        appointments: appointmentPayload,
      },
    };
  }

  async setPhone(params: { publicUserId: string; phoneE164: string }) {
    const { publicUserId, phoneE164 } = params;

    if (!phoneE164 || !phoneE164.startsWith('+')) {
      throw new BadRequestException(
        'phoneE164 must be in E.164 format, example: +5213312345678',
      );
    }

    await this.db
      .update(publicUsers)
      .set({ phoneE164 })
      .where(eq(publicUsers.id, publicUserId));

    return { ok: true };
  }
}
