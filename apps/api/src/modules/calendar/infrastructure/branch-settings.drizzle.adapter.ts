import { eq } from 'drizzle-orm';
import { db } from 'src/modules/db/client';
import { branchSettings } from 'src/modules/db/schema/branches/branchSettings';

import { BranchSettingsPort } from '../core/ports/branch-settings.port';

export class BranchSettingsDrizzleAdapter implements BranchSettingsPort {
  async getTimezone(branchId: string): Promise<string> {
    const row = await db.query.branchSettings.findFirst({
      where: eq(branchSettings.branchId, branchId),
    });

    // 🔥 fallback seguro
    return row?.timezone ?? 'America/Mexico_City';
  }
}
