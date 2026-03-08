import { User } from '../entities/user.entity';

export interface UsersRepositoryPort {
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;

  create(data: {
    email: string;
    passwordHash: string;
    role: string;
    organizationId?: string | null;
  }): Promise<User>;
}
