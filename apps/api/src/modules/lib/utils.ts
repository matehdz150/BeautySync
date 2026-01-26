import slugify from 'slugify';
import { eq } from 'drizzle-orm';
import { branches } from 'src/modules/db/schema';
import { db } from 'src/modules/db/client';

export async function generateUniqueBranchSlug(name: string): Promise<string> {
  const baseSlug = slugify(name, {
    lower: true,
    strict: true,
    trim: true,
  });

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const exists = await db.query.branches.findFirst({
      where: eq(branches.publicSlug, slug),
    });

    if (!exists) break;

    counter++;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}
