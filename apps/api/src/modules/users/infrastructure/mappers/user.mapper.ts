import { User } from '../../core/entities/user.entity';
import { users } from 'src/modules/db/schema';

type UserRow = typeof users.$inferSelect;

export class UserMapper {
  static toDomain(row: UserRow): User {
    return new User(
      row.id,
      row.email,
      row.name,
      row.organizationId,
      row.role,
      row.avatarUrl,
    );
  }
}
