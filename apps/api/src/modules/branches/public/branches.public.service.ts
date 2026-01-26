import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Inject,
} from '@nestjs/common';

import { and, eq } from 'drizzle-orm';
import type * as client from 'src/modules/db/client';
import { branches, services } from 'src/modules/db/schema';

@Injectable()
export class BranchesPublicService {
  constructor(@Inject('DB') private readonly db: client.DB) {}

  async getBySlug(slug: string) {
    if (!slug) {
      throw new BadRequestException('Slug requerido');
    }

    // 1️⃣ Buscar branch por slug
    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
      with: {
        images: true,
      },
    });

    if (!branch) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    if (!branch.publicPresenceEnabled) {
      throw new ForbiddenException('Sucursal no pública');
    }

    // 2️⃣ Servicios activos de la branch
    const branchServices = await this.db.query.services.findMany({
      where: and(eq(services.branchId, branch.id), eq(services.isActive, true)),
      with: {
        category: true,
      },
      orderBy: (services, { asc }) => asc(services.name),
    });

    // 3️⃣ Response público (CONTROLADO)
    return {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      slug: branch.publicSlug,
      lat: branch.lat,
      lng: branch.lng,
      description: branch.description,

      images: branch.images.map((img) => ({
        id: img.id,
        url: img.url,
        isCover: img.isCover,
      })),

      services: branchServices.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        durationMin: s.durationMin,
        priceCents: s.priceCents,
        category: s.category
          ? {
              id: s.category.id,
              name: s.category.name,
              icon: s.category.icon,
              hexColor: s.category.colorHex,
            }
          : null,
      })),
    };
  }
}
