import { useBranch } from "@/context/BranchContext";
import { useStaffDraft } from "@/context/StaffDraftContext";
import {
  assignServiceToStaff,
  unassignServiceFromStaff,
} from "@/lib/services/services";
import { createStaff, inviteStaff, updateStaff } from "@/lib/services/staff";
import {
  clearStaffSchedules,
  createStaffSchedule,
} from "@/lib/services/staffSchedules";

export function useStaffSubmit() {
  const { state, dispatch } = useStaffDraft();
  const { branch } = useBranch();

  /* =====================
     CREATE
  ===================== */
  async function submitCreate() {
    const staff = await createStaff({
      name: state.base.name,
      email: state.base.email,
      branchId: branch!.id,
      jobRole: state.base.jobRole,
      avatarUrl: state.base.avatarUrl ?? null,
    });

    dispatch({ type: "SET_CREATED_STAFF_ID", payload: staff.id });

    // schedules
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

    // services
    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.services.map((serviceId: any) =>
        assignServiceToStaff({ staffId: staff.id, serviceId })
      )
    );

    // invite
    await inviteStaff({
      email: state.base.email,
      staffId: staff.id,
      role: state.base.permissionRole,
    });
  }

  /* =====================
     UPDATE
  ===================== */
  async function submitUpdate() {
    const staffId = state.createdStaffId!;
    if (!staffId) throw new Error("Missing staffId");

    // base
    await updateStaff(staffId, {
      name: state.base.name,
      email: state.base.email,
      phone: state.base.phone,
      jobRole: state.base.jobRole,
      avatarUrl: state.base.avatarUrl ?? null,
    });

    // schedules
    await clearStaffSchedules(staffId);
    await Promise.all(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      state.schedules.map((s: { dayOfWeek: any; startTime: any; endTime: any; }) =>
        createStaffSchedule({
          staffId,
          dayOfWeek: s.dayOfWeek,
          startTime: s.startTime,
          endTime: s.endTime,
        })
      )
    );

    // services (sync)
    await syncStaffServices(
      staffId,
      state.services, // lo que el usuario dejó marcado
      state.originalServices // los que venían del backend
    );
  }

  return { submitCreate, submitUpdate };
}

export async function syncStaffServices(
  staffId: string,
  selectedServiceIds: string[],
  existingServiceIds: string[]
) {
  const toAdd = selectedServiceIds.filter(
    (id) => !existingServiceIds.includes(id)
  );

  const toRemove = existingServiceIds.filter(
    (id) => !selectedServiceIds.includes(id)
  );

  await Promise.all([
    ...toAdd.map((serviceId) => assignServiceToStaff({ staffId, serviceId })),
    ...toRemove.map((serviceId) =>
      unassignServiceFromStaff({ staffId, serviceId })
    ),
  ]);
}
