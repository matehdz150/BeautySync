import {
  createStaff,
  inviteStaff,
} from "@/lib/services/staff";
import { createStaffSchedule } from "@/lib/services/staffSchedules";
import { assignServiceToStaff } from "@/lib/services/services";
import { useStaffDraft } from "@/context/StaffDraftContext";
import { useBranch } from "@/context/BranchContext";

export function useCreateStaff() {
  const { state, dispatch } = useStaffDraft();
  const { branch } = useBranch();

  async function submit() {
    if (!branch?.id) {
      throw new Error("No branch selected");
    }

    /* =====================
       1. CREATE STAFF
    ===================== */

    const staff = await createStaff({
      name: state.base.name,
      email: state.base.email,
      branchId: branch.id,
    });

    dispatch({
      type: "SET_CREATED_STAFF_ID",
      payload: staff.id,
    });

    /* =====================
       2. SCHEDULES
    ===================== */

    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.schedules.map((s: { dayOfWeek: any; startTime: any; endTime: any; }) =>
        createStaffSchedule({
          staffId: staff.id,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })
      )
    );

    /* =====================
       3. SERVICES
    ===================== */

    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.services.map((serviceId: any) =>
        assignServiceToStaff({
          staffId: staff.id,
          serviceId,
        })
      )
    );

    /* =====================
       4. INVITE (optional)
    ===================== */

    await inviteStaff({
      email: state.base.email,
      staffId: staff.id,
      role: state.base.permissionRole,
    });

    return staff;
  }

  return { submit };
}