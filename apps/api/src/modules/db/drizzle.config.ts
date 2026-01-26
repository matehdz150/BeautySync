// eslint-disable-next-line prettier/prettier
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: './src/modules/db/schema',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
