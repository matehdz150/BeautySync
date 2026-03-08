import { PublicUser } from '../entities/publicUser.entity';

export interface PublicUsersRepositoryPort {
  findByGoogleSub(sub: string): Promise<PublicUser | null>;

  findByEmail(email: string): Promise<PublicUser | null>;

  create(data: {
    email: string | null;
    googleSub: string;
    name: string | null;
    avatarUrl: string | null;
  }): Promise<PublicUser>;

  updateLogin(
    userId: string,
    data: {
      email?: string | null;
      name?: string | null;
      avatarUrl?: string | null;
    },
  ): Promise<void>;

  findById(id: string): Promise<PublicUser | null>;
}
