// core/ports/service.repository.ts

import { Service } from '../entities/service.entity';

export interface CreateServiceInput {
  organizationId: string;
  branchId: string;
  categoryId?: string;
  name: string;
  description?: string;
  durationMin: number;
  priceCents?: number;
}

export interface UpdateServiceInput {
  name?: string;
  description?: string;
  durationMin?: number;
  priceCents?: number;
  categoryId?: string;
}

export interface ServiceRepository {
  findAll(branchId: string): Promise<Service[]>;

  findById(id: string): Promise<Service | null>;

  create(input: CreateServiceInput): Promise<Service>;

  update(id: string, input: UpdateServiceInput): Promise<Service>;

  delete(id: string): Promise<void>;

  assignToStaff(staffId: string, serviceId: string): Promise<void>;

  unassignFromStaff(staffId: string, serviceId: string): Promise<void>;

  findWithStaff(branchId: string): Promise<any[]>;

  getNotes(serviceId: string): Promise<string[]>;

  addNote(serviceId: string, text: string): Promise<string[]>;

  removeNote(serviceId: string, index: number): Promise<string[]>;

  getRules(serviceId: string): Promise<string[]>;

  addRule(serviceId: string, text: string): Promise<string[]>;

  removeRule(serviceId: string, index: number): Promise<string[]>;
}
