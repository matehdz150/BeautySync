"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useStaffDraft } from "@/context/StaffDraftContext";
import { getStaffById } from "@/lib/services/staff";
import NewStaffPage from "../../new/page";

export default function EditStaffPage() {
  const { id } = useParams<{ id: string }>();
  const { dispatch } = useStaffDraft();

  function normalizeTime(t: string) {
    return t.slice(0, 5); // "10:00:00" → "10:00"
  }

  useEffect(() => {
    if (!id) return;

    async function load() {
      const staff = await getStaffById(id);
      console.log(staff);

      dispatch({
        type: "HYDRATE",
        payload: {
          staffId: staff.id,
          base: {
            name: staff.name,
            email: staff.email,
            phone: staff.phone ?? "",
            jobRole: staff.jobRole ?? "",
            permissionRole: staff.permissionRole,
            avatarUrl: staff.avatarUrl,
          },
          schedules: staff.schedules.map((s: any) => ({
            staffId: staff.id,
            dayOfWeek: s.dayOfWeek,
            startTime: normalizeTime(s.startTime),
            endTime: normalizeTime(s.endTime),
          })),
          services: staff.services,
        },
      });
    }

    load();
  }, [id, dispatch]);

  return <NewStaffPage />;
}
