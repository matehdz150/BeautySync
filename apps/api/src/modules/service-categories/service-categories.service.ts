import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { eq } from 'drizzle-orm';

import * as client from 'src/modules/db/client';
import { serviceCategories } from 'src/modules/db/schema';

import { CreateServiceCategoryDto } from './dto/create-service-category.dto';
import { UpdateServiceCategoryDto } from './dto/update-service-category.dto';

@Injectable()
export class ServiceCategoriesService {
  constructor(@Inject('DB') private db: client.DB) {}

  findAll() {
    return this.db.select().from(serviceCategories);
  }

  async create(dto: CreateServiceCategoryDto) {
    const existing = await this.db.query.serviceCategories.findFirst({
      where: eq(serviceCategories.name, dto.name),
    });

    if (existing) {
      throw new BadRequestException('Category name already exists');
    }

    const [row] = await this.db
      .insert(serviceCategories)
      .values(dto)
      .returning();

    return row;
  }

  async update(id: string, dto: UpdateServiceCategoryDto) {
    const [row] = await this.db
      .update(serviceCategories)
      .set(dto)
      .where(eq(serviceCategories.id, id))
      .returning();

    if (!row) throw new NotFoundException('Category not found');

    return row;
  }

  async remove(id: string) {
    const [row] = await this.db
      .delete(serviceCategories)
      .where(eq(serviceCategories.id, id))
      .returning();

    if (!row) throw new NotFoundException('Category not found');

    return { ok: true };
  }
}
