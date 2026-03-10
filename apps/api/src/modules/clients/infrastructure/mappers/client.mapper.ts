import { clients } from 'src/modules/db/schema';
import { Client } from '../../core/entities/client.entity';

type ClientRow = typeof clients.$inferSelect;

export class ClientMapper {
  static toDomain(row: ClientRow): Client {
    return new Client(
      row.id,
      row.organizationId,
      row.name,
      row.email,
      row.phone,
      row.avatarUrl,
      row.birthdate,
      row.createdAt,
    );
  }
}
