import {
  Client,
  ClientDetails,
  ClientEditData,
  OrganizationClientListItem,
} from '../entities/client.entity';

export interface CreateClientInput {
  organizationId: string;

  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthdate?: string;

  profile?: {
    gender?: string;
    occupation?: string;
    city?: string;
    ageRange?: string;
    preferredStaffId?: string;
    marketingOptIn?: boolean;
  };
}

export interface UpdateClientInput {
  organizationId?: string;

  name?: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  birthdate?: string;

  profile?: {
    gender?: string;
    occupation?: string;
    city?: string;
    ageRange?: string;
    preferredStaffId?: string;
    marketingOptIn?: boolean;
  };
}

export type PublicClient = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;

  publicUserId: string;
};

export interface ClientsRepository {
  findAll(): Promise<Client[]>;
  findOne(id: string): Promise<ClientDetails>;
  create(dto: CreateClientInput): Promise<Client>;
  update(id: string, dto: UpdateClientInput): Promise<Client>;
  delete(id: string): Promise<{ ok: true }>;
  findByOrganization(orgId: string): Promise<OrganizationClientListItem[]>;
  findPublicClientsByOrganization(orgId: string): Promise<PublicClient[]>;
  findEditData(id: string): Promise<ClientEditData>;
}
