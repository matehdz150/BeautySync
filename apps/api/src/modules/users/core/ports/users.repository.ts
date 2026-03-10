import { User } from '../entities/user.entity';

export interface CreateUserInput {
  email: string;
  name?: string;
  password: string;
  organizationId: string;
  role?: string;
}

export interface UpdateUserInput {
  name?: string;
  avatarUrl?: string;
  role?: string;
}

export interface UsersRepository {
  findAll(): Promise<User[]>;

  findOne(id: string): Promise<User>;

  findByEmail(email: string): Promise<User | null>;

  create(data: CreateUserInput): Promise<User>;

  update(id: string, data: UpdateUserInput): Promise<User>;

  updatePassword(id: string, passwordHash: string): Promise<void>;

  remove(id: string): Promise<void>;
}
