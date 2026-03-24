export interface BranchSettingsPort {
  getTimezone(branchId: string): Promise<string | null>;
}
