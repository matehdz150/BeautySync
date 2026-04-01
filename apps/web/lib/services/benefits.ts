// services/benefits.ts

import { api } from "./api";

export async function activateBenefitProgram(data: {
  branchId: string;
  name?: string;
}) {
  return api<{
    id: string;
    branchId: string;
    isActive: boolean;
    name?: string;
  }>("/benefits/program/activate", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export type BenefitProgramState = {
  exists: boolean;
  isActive: boolean;
  name: string | null;
};

export type BenefitRule = {
  id: string;
  type:
    | "BOOKING_COUNT"
    | "SPEND_ACCUMULATED"
    | "REVIEW_CREATED"
    | "ONLINE_PAYMENT"
    | "FIRST_BOOKING"
    | "REFERRAL";
  isActive: boolean;
  config: Record<string, unknown>;
};

export type GetBenefitRulesResponse = {
  program: BenefitProgramState;
  rules: BenefitRule[];
};

export async function getBenefitRulesByBranch(branchId: string) {
  return api<GetBenefitRulesResponse>(
    `/benefits/program/branch/${branchId}`,
    {
      method: "GET",
    }
  );
}