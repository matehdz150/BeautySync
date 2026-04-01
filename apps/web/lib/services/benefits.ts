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

export async function getBenefitRulesByBranch(branchId: string) {
  return api<BenefitRule[]>(
    `/benefits/rules/branch/${branchId}`,
    {
      method: "GET",
    }
  );
}