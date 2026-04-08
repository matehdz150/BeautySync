import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as client from 'src/modules/db/client';
import { branches, services, staff } from 'src/modules/db/schema';
import { and, eq } from 'drizzle-orm';
import {
  BranchesRepository,
  CreateBranchInput,
  UpdateBranchLocationInput,
  UpdateBranchInput,
} from '../../core/ports/branches.repository';
import { BranchMapper } from '../mappers/branch.mapper';
import { Branch } from '../../core/entities/branch.entity';
import {
  BranchCacheService,
} from 'src/modules/cache/application/branch-cache.service';

@Injectable()
export class BranchesDrizzleRepository implements BranchesRepository {
  constructor(
    @Inject('DB') private db: client.DB,
    private readonly branchCache: BranchCacheService,
  ) {}

  findAll() {
    return this.db.select().from(branches);
  }

  async findByOrg(orgId: string) {
    return this.branchCache.getBranches(orgId);
  }

  async create(data: CreateBranchInput) {
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
    const staffMember = await this.db.query.staff.findFirst({
      where: eq(staff.userId, userId),
    });

    if (!staffMember) {
      return {
        branch: null,
        reason: 'USER_NOT_STAFF',
      };
    }

    const branchRow = await this.db.query.branches.findFirst({
      where: eq(branches.id, staffMember.branchId),
    });

    if (!branchRow) {
      return { branch: null };
    }

    return {
      branch: BranchMapper.toDomain(branchRow),
    };
  }

  async updateLocation(branchId: string, dto: UpdateBranchLocationInput) {
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

  async updateBranch(branchId: string, dto: UpdateBranchInput) {
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
        name: dto.name,
        address: dto.address,
        description: dto.description,
        updatedAt: new Date(),
      })
      .where(eq(branches.id, branchId))
      .returning();

    if (!updated) throw new NotFoundException('Branch not found');

    return updated;
  }

  async getBasic(branchId: string) {
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

  async getBranchForAi(branchId: string): Promise<{
    branch: Branch;
    services: { name: string }[];
  }> {
    if (!branchId) {
      throw new BadRequestException('branchId requerido');
    }

    const branchRow = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    if (!branchRow) {
      throw new NotFoundException('Sucursal no encontrada');
    }

    const branchServices = await this.db.query.services.findMany({
      where: and(
        eq(services.branchId, branchRow.id),
        eq(services.isActive, true),
      ),
      orderBy: (services, { asc }) => asc(services.name),
      columns: {
        name: true,
      },
    });

    return {
      branch: BranchMapper.toDomain(branchRow),
      services: branchServices,
    };
  }

  async findById(branchId: string): Promise<Branch | null> {
    const row = await this.db.query.branches.findFirst({
      where: eq(branches.id, branchId),
    });

    return row ?? null;
  }
}
