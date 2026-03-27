// src/db/setupConstraints.ts

import { db } from './client';
import { sql } from 'drizzle-orm';

/**
 * ============================================
 * 🔒 ensureBookingConstraints
 * ============================================
 *
 * Este método garantiza que la base de datos tenga el constraint necesario
 * para evitar doble booking en citas (appointments).
 *
 * ⚠️ CONTEXTO IMPORTANTE
 * --------------------------------------------
 * En este proyecto NO usamos migrations tradicionales (drizzle migrate),
 * sino `db:push`. Esto implica que constraints avanzados como EXCLUDE
 * no siempre están garantizados en todos los entornos.
 *
 * Por eso, este método:
 * - Se ejecuta en runtime (al levantar el backend)
 * - Es idempotente (puede correr múltiples veces sin romper)
 * - Es seguro en entornos con múltiples instancias
 *
 * --------------------------------------------
 * 🧠 PROBLEMA QUE RESUELVE
 * --------------------------------------------
 * Evita que dos usuarios reserven el mismo slot al mismo tiempo
 * (race condition / concurrencia).
 *
 * Ejemplo:
 * - Usuario A y B reservan 10:00 - 11:00 simultáneamente
 * - Sin constraint → ambos pasan validación → doble booking ❌
 * - Con constraint → Postgres bloquea uno automáticamente ✅
 *
 * --------------------------------------------
 * 🧱 SOLUCIÓN IMPLEMENTADA
 * --------------------------------------------
 *
 * Se usa un constraint de Postgres:
 *
 *   EXCLUDE USING gist (
 *     branch_id WITH =,
 *     staff_id WITH =,
 *     tstzrange(start, "end", '[)') WITH &&
 *   )
 *
 * Esto significa:
 * - Mismo branch
 * - Mismo staff
 * - Rangos de tiempo que se solapan
 *
 * 👉 NO pueden coexistir
 *
 * --------------------------------------------
 * 🔒 CONCURRENCIA ENTRE INSTANCIAS
 * --------------------------------------------
 *
 * En producción puede haber múltiples instancias del backend
 * (pods, contenedores, autoscaling, etc).
 *
 * Si todas ejecutan este código al mismo tiempo, podrían intentar
 * hacer ALTER TABLE simultáneamente → error.
 *
 * Para evitarlo usamos:
 *
 *   SELECT pg_advisory_lock(...)
 *
 * Esto asegura que:
 * - Solo UNA instancia ejecuta el bloque crítico
 * - Las demás esperan
 *
 * --------------------------------------------
 * 🔁 IDEMPOTENCIA
 * --------------------------------------------
 *
 * Se valida:
 * - Que la tabla exista
 * - Que el constraint NO exista
 *
 * Esto permite:
 * - Deploys repetidos sin romper
 * - Reinicios seguros
 *
 * --------------------------------------------
 * ⚠️ CONSIDERACIONES IMPORTANTES
 * --------------------------------------------
 *
 * 1. Este constraint aplica a TODAS las citas
 *    → incluso CANCELLED
 *
 *    👉 Si en el futuro quieres que citas canceladas NO bloqueen slots,
 *       deberás convertir esto en un constraint parcial:
 *
 *       WHERE status IN ('CONFIRMED', 'PENDING')
 *
 * 2. staff_id NO debe ser NULL
 *    → de lo contrario el constraint puede no comportarse correctamente
 *
 * 3. Este código ejecuta DDL en runtime
 *    → aceptable para MVP / early-stage
 *    → en el futuro se recomienda migrarlo a migrations formales
 *
 * --------------------------------------------
 * 💡 POR QUÉ ESTO ES IMPORTANTE
 * --------------------------------------------
 *
 * Este constraint es la última línea de defensa contra doble booking.
 * Ninguna validación en código reemplaza esto.
 *
 * Incluso si:
 * - Redis falla
 * - Hay race conditions
 * - Hay múltiples requests simultáneos
 *
 * 👉 Postgres garantiza la integridad
 *
 * --------------------------------------------
 * 🚀 NIVEL DE ROBUSTEZ
 * --------------------------------------------
 *
 * Con esto + manejo de error 23P01 en el service:
 *
 * ✔️ Sistema seguro ante concurrencia real
 * ✔️ Apto para producción con múltiples instancias
 * ✔️ Comparable a sistemas de booking reales (SaaS)
 *
 */
export async function ensureBookingConstraints() {
  // 🔒 Lock global para evitar race condition entre instancias
  await db.execute(sql`
    SELECT pg_advisory_lock(123456);
  `);

  try {
    // 🔥 Extensión necesaria para EXCLUDE USING gist
    await db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS btree_gist;
    `);

    // 🔍 para similarity search
    await db.execute(sql`
      CREATE EXTENSION IF NOT EXISTS pg_trgm;
    `);

    // 🔥 Crear constraint si no existe
    await db.execute(sql`
      DO $$
      BEGIN
        -- Verifica que la tabla exista
        IF EXISTS (
          SELECT 1
          FROM information_schema.tables
          WHERE table_name = 'appointments'
        ) THEN

          -- Verifica que el constraint no exista
          IF NOT EXISTS (
            SELECT 1 FROM pg_constraint
            WHERE conname = 'appointments_no_overlap_per_branch_staff'
          ) THEN

            -- 🔒 Constraint anti-overlap
            ALTER TABLE appointments
            ADD CONSTRAINT appointments_no_overlap_per_branch_staff
            EXCLUDE USING gist (
              branch_id WITH =,
              staff_id WITH =,
              tstzrange(start, "end", '[)') WITH &&
            );

          END IF;

        END IF;
      END $$;
    `);
  } finally {
    // 🔓 Liberar lock SIEMPRE
    await db.execute(sql`
      SELECT pg_advisory_unlock(123456);
    `);
  }
}
