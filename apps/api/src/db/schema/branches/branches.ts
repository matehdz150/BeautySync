/* eslint-disable prettier/prettier */
import {
  pgTable,
  uuid,
  text,
  timestamp,
  index,
  boolean,
  uniqueIndex,
  numeric,
} from "drizzle-orm/pg-core";
import { organizations } from "../organizations";

export const branches = pgTable(
  "branches",
  {
    id: uuid("id").primaryKey().defaultRandom(),

    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),

    name: text("name").notNull(),

    // Dirección escrita por el negocio
    address: text("address"),

    description: text("description"),

    // Coordenadas exactas del pin
    lat: numeric("lat", { precision: 10, scale: 7 }),
    lng: numeric("lng", { precision: 10, scale: 7 }),

    // Si ya se configuró la ubicación (para UI / validación)
    isLocationVerified: boolean("is_location_verified")
      .notNull()
      .default(false),

    publicPresenceEnabled: boolean("public_presence_enabled")
      .notNull()
      .default(false),

    publicSlug: text("public_slug"),
    
    locationUpdatedAt: timestamp("location_updated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
  },

  (table) => ({
    orgIdx: index("branch_org_idx").on(table.organizationId),
    nameIdx: index("branch_name_idx").on(table.name),

    // para render rápido en mapas / filtros simples
    latIdx: index("branch_lat_idx").on(table.lat),
    lngIdx: index("branch_lng_idx").on(table.lng),

    publicSlugUnique: uniqueIndex("branches_public_slug_unique").on(
      table.publicSlug
    ),
  })
);