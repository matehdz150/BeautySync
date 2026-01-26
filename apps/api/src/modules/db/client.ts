import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import 'dotenv/config';

const client = postgres(process.env.DATABASE_URL!, { max: 1 });

export const db = drizzle(client, { schema });
export type DB = typeof db;

export function getDb() {
  throw new Error('Function not implemented.');
}
