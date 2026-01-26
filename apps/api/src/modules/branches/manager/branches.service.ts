import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as client from 'src/modules/db/client';
import { branches, services, staff } from 'src/modules/db/schema';
import { and, eq } from 'drizzle-orm';
import { CreateBranchDto } from '../dto/create-branch.dto';
import { UpdateBranchLocationDto } from '../dto/branch-location.dto';
import { UpdateBranchDto } from '../dto/update-branch.dto';

@Injectable()
export class BranchesService {
  constructor(@Inject('DB') private db: client.DB) {}

  findAll() {
    return this.db.select().from(branches);
  }

  findByOrg(orgId: string) {
    return this.db.query.branches.findMany({
      where: eq(branches.organizationId, orgId),
    });
  }

  async create(data: CreateBranchDto) {
    const lat = data.lat;
    const lng = data.lng;

    const latProvided = typeof lat === 'number';
    const lngProvided = typeof lng === 'number';

    if (latProvided !== lngProvided) {
      throw new BadRequestException('lat y lng deben venir juntos');
    }

    const hasCoords = latProvided && lngProvided;

    const [branch] = await this.db
      .insert(branches)
      .values({
        organizationId: data.organizationId,
        name: data.name,
        address: data.address ?? null,
        lat: hasCoords ? lat.toString() : null,
        lng: hasCoords ? lng.toString() : null,
        isLocationVerified: hasCoords,
        locationUpdatedAt: hasCoords ? new Date() : null,
      })
      .returning();

    return branch;
  }

  async findBranchByUser(userId: string) {
    // buscar si es staff
    const staffMember = await this.db.query.staff.findFirst({
      where: eq(staff.userId, userId),
    });

    if (!staffMember) {
      return {
        branch: null,
        reason: 'USER_NOT_STAFF',
      };
    }

    // buscar branch
    const branchResult = await this.db.query.branches.findFirst({
      where: eq(branches.id, staffMember.branchId),
    });

    return {
      branch: branchResult,
    };
  }

  async updateLocation(branchId: string, dto: UpdateBranchLocationDto) {
    const [updated] = await this.db
      .update(branches)
      .set({
        address: dto.address ?? null,
        lat: dto.lat.toString(),
        lng: dto.lng.toString(),
        isLocationVerified: dto.isLocationVerified ?? true,
        locationUpdatedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(branches.id, branchId))
      .returning();

    if (!updated) throw new NotFoundException('Branch not found');

    return updated;
  }

  async getBranchForAi(branchId: string) {
    if (!branchId) throw new BadRequestException('branchId requerido');

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    const branchServices = await this.db.query.services.findMany({
      where: and(eq(services.branchId, branch.id), eq(services.isActive, true)),
      orderBy: (services, { asc }) => asc(services.name),
    });

    return {
      branch,
      services: branchServices,
    };
  }

  async updateBranch(branchId: string, dto: UpdateBranchDto) {
    if (!branchId) throw new BadRequestException('branchId requerido');

    const hasSomethingToUpdate =
      typeof dto.name === 'string' ||
      typeof dto.address === 'string' ||
      typeof dto.description === 'string';

    if (!hasSomethingToUpdate) {
      throw new BadRequestException('Nada que actualizar');
    }

    const [updated] = await this.db
      .update(branches)
      .set({
        name: typeof dto.name === 'string' ? dto.name : undefined,
        address: typeof dto.address === 'string' ? dto.address : undefined,
        description:
          typeof dto.description === 'string' ? dto.description : undefined,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, branchId))
      .returning();

    if (!updated) throw new NotFoundException('Branch not found');

    return updated;
  }

  async getBasic(branchId: string) {
    if (!branchId) throw new BadRequestException('branchId requerido');

    const branch = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
      columns: {
        id: true,
        name: true,
        address: true,
        description: true,
      },
    });

    if (!branch) throw new NotFoundException('Sucursal no encontrada');

    return branch;
  }
}
