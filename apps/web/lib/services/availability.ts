import { api } from "./api";

export async function getAvailability(params: {
  branchId: string;
  serviceId: string;
  date: string;
  staffId?: string;
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = new URLSearchParams(params as any).toString();

  return api(`/availability?${query}`);
}

export async function getAvailableServicesForSlot(params: {
  branchId: string;
  staffId: string;
  datetime: string; // ISO
}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const query = new URLSearchParams(params as any).toString();

  return api(`/availability/available-services?${query}`);
}