import {
  Client,
  ClientDetails,
  OrganizationClientListItem,
} from '../entities/client.entity';

export interface CreateClientInput {
  organizationId: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthdate?: string;
}

export interface UpdateClientInput {
  organizationId?: string;
  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthdate?: string;
}

export interface ClientsRepository {
  findAll(): Promise<Client[]>;
  findOne(id: string): Promise<ClientDetails>;
  create(dto: CreateClientInput): Promise<Client>;
  update(id: string, dto: UpdateClientInput): Promise<Client>;
  delete(id: string): Promise<{ ok: true }>;
  findByOrganization(orgId: string): Promise<OrganizationClientListItem[]>;
}
