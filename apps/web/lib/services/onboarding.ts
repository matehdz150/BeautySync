import { api } from "./api";

export type OnboardResponse = {
  organizationId: string;
  branchId: string;
  token: string;
};

export async function onboardOwner(data: {
  organizationName: string;
  branches: Array<{
    name: string;
    address?: string;
    settings?: {
      timezone?: string;
      minBookingNoticeMin?: number;
      maxBookingAheadDays?: number;
      cancelationWindowMin?: number;
      bufferBeforeMin?: number;
      bufferAfterMin?: number;
    };
  }>;
}) {
  return api<OnboardResponse>("/onboarding/owner", {
    method: "POST",
    body: JSON.stringify(data),
  });
}