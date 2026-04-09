import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from './schema';
import 'dotenv/config';
import { PgTransaction } from 'drizzle-orm/pg-core';
import { instrumentPostgresClient } from './instrumented-postgres';

const rawClient = postgres(process.env.DATABASE_URL!, { max: 1 });
const client = instrumentPostgresClient(rawClient);

export const db = drizzle(client, { schema });
export type DB = typeof db;

export function getDb() {
  throw new Error('Function not implemented.');
}

export type DbOrTx = DB | PgTransaction<any, any, any>;
