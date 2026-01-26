"use client";

import { useEffect, useMemo, useState } from "react";
import { useBranch } from "@/context/BranchContext";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Check, Shuffle, Users } from "lucide-react";

import { getStaffForService } from "@/lib/services/staff";
import { useBookingManagerDraft } from "@/context/BookingManagerDraftContext";

type Staff = {
  id: string;
  name: string;
  photoUrl?: string | null;
};

type ScreenMode = "DECISION" | "BY_SERVICE";

export function StepStaff() {
  const { branch } = useBranch();
  const { state, actions } = useBookingManagerDraft();

  const [screen, setScreen] = useState<ScreenMode>("DECISION");
  const [staffMap, setStaffMap] = useState<Record<string, Staff[]>>({});
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const serviceIds = useMemo(() => state.services.map((s) => s.id), [state.services]);

  // init active service
  useEffect(() => {
    if (!activeServiceId && serviceIds.length > 0) {
      setActiveServiceId(serviceIds[0]);
    }
  }, [serviceIds, activeServiceId]);

  // ============================
  // FETCH STAFF PER SERVICE
  // ============================
  useEffect(() => {
    if (!branch?.id) return;
    if (serviceIds.length === 0) return;

    setLoading(true);

    Promise.all(
      serviceIds.map(async (serviceId) => {
        const staff = await getStaffForService(branch.id, serviceId);
        return { serviceId, staff: (staff ?? []) as Staff[] };
      })
    )
      .then((res) => {
        const map: Record<string, Staff[]> = {};
        res.forEach(({ serviceId, staff }) => {
          map[serviceId] = staff;
        });

        setStaffMap(map);
      })
      .finally(() => setLoading(false));
  }, [branch?.id, serviceIds]);

  // ============================
  // GLOBAL STAFF (puede hacer TODOS los servicios)
  // ============================
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const globalStaff = useMemo(() => {
    if (serviceIds.length === 0) return [];

    // si aún no están todas las listas cargadas
    for (const id of serviceIds) {
      if (!Array.isArray(staffMap[id])) return [];
    }

    const first = staffMap[serviceIds[0]] ?? [];

    return first.filter((st) =>
      serviceIds.every((serviceId) =>
        (staffMap[serviceId] ?? []).some((s) => s.id === st.id)
      )
    );
  }, [serviceIds, staffMap]);

  // ============================
  // ACTIONS
  // ============================

  function chooseAnyForAll() {
    actions.setStaffChoiceMode("ANY");

    // importante: setear por servicio para que StepPlan pueda armar chain
    serviceIds.forEach((serviceId) => {
      actions.setStaffForService(serviceId, "ANY");
    });
  }

  function chooseSingleStaffForAll(staffId: string) {
    actions.setStaffChoiceMode("SINGLE_STAFF");
    actions.setSingleStaffId(staffId);

    serviceIds.forEach((serviceId) => {
      actions.setStaffForService(serviceId, staffId);
    });
  }

  function chooseByService() {
    actions.setStaffChoiceMode("PER_SERVICE");
    setScreen("BY_SERVICE");
  }

  function selectStaffForService(serviceId: string, staffId: string | "ANY") {
    actions.setStaffChoiceMode("PER_SERVICE");
    actions.setStaffForService(serviceId, staffId);

    // auto avanzar al siguiente servicio sin asignar
    const index = serviceIds.indexOf(serviceId);
    for (let i = index + 1; i < serviceIds.length; i++) {
      const nextId = serviceIds[i];
      if (!state.staffByService[nextId]) {
        setActiveServiceId(nextId);
        return;
      }
    }
  }

  // ============================
  // UI STATES
  // ============================
  if (!branch) {
    return <div className="py-8 text-sm text-muted-foreground">No branch</div>;
  }

  if (serviceIds.length === 0) {
    return (
      <div className="py-8 text-sm text-muted-foreground">
        Select at least 1 service first.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3 py-2">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  // ============================
  // RENDER
  // ============================
  return (
    <div className="space-y-6">
      {/* ================= DECISION ================= */}
      {screen === "DECISION" && (
        <div className="space-y-3">
          {/* ANY */}
          <StaffCard
            name="Cualquiera"
            selected={state.staffChoiceMode === "ANY"}
            onClick={chooseAnyForAll}
            variant="any"
            description="Asignaremos automáticamente al mejor disponible"
          />
          {/* Global staff options */}
          {globalStaff.map((st) => (
            <StaffCard
              key={st.id}
              name={st.name}
              avatarUrl={st.photoUrl ?? undefined}
              selected={state.staffChoiceMode === "SINGLE_STAFF" && state.singleStaffId === st.id}
              onClick={() => chooseSingleStaffForAll(st.id)}
              description="Este profesional puede realizar todos los servicios"
            />
          ))}

          {/* BY SERVICE */}
          <StaffCard
            name="Elegir profesional por servicio"
            selected={state.staffChoiceMode === "PER_SERVICE"}
            onClick={chooseByService}
            variant="by-service"
            description="Asigna un profesional distinto para cada servicio"
          />
        </div>
      )}

      {/* ================= BY SERVICE ================= */}
      {screen === "BY_SERVICE" && activeServiceId && (
        <div className="space-y-5">
          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {serviceIds.map((id) => {
              const service = state.services.find((s) => s.id === id);
              const active = id === activeServiceId;
              const assigned = !!state.staffByService[id];

              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setActiveServiceId(id)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm whitespace-nowrap",
                    active ? "bg-black text-white" : "bg-white"
                  )}
                >
                  {service?.name ?? "Service"}
                  {assigned && <Check className="ml-2 inline w-4 h-4" />}
                </button>
              );
            })}
          </div>

          {/* Staff list */}
          <div className="space-y-2">
            {/* ANY for this service */}
            <StaffCard
              name="Cualquiera"
              selected={state.staffByService[activeServiceId] === "ANY"}
              onClick={() => selectStaffForService(activeServiceId, "ANY")}
              variant="any"
            />

            {(staffMap[activeServiceId] ?? []).map((st) => (
              <StaffCard
                key={st.id}
                name={st.name}
                avatarUrl={st.photoUrl ?? undefined}
                selected={state.staffByService[activeServiceId] === st.id}
                onClick={() => selectStaffForService(activeServiceId, st.id)}
              />
            ))}

            {(staffMap[activeServiceId] ?? []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No team members available for this service
              </p>
            )}
          </div>

          {/* Back to decision */}
          <button
            type="button"
            onClick={() => setScreen("DECISION")}
            className="text-sm text-muted-foreground hover:text-black"
          >
            ← Back to options
          </button>
        </div>
      )}
    </div>
  );
}

/* =====================
   STAFF CARD
===================== */

function StaffCard({
  name,
  avatarUrl,
  selected,
  onClick,
  variant = "default",
  description,
}: {
  name: string;
  avatarUrl?: string;
  selected: boolean;
  onClick: () => void;
  variant?: "default" | "any" | "by-service";
  description?: string;
}) {
  const isAny = variant === "any";
  const isByService = variant === "by-service";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-4 rounded-xl border px-4 py-5 transition",
        selected ? "border-indigo-500 bg-indigo-50" : "hover:bg-gray-50"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden",
          isAny && "bg-indigo-400 text-white",
          isByService && "bg-gray-900 text-white",
          !isAny && !isByService && "bg-gray-200 text-gray-700"
        )}
      >
        {isAny ? (
          <Shuffle className="w-5 h-5" />
        ) : isByService ? (
          <Users className="w-5 h-5" />
        ) : avatarUrl ? (
          <img
            src={avatarUrl}
            alt={name}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium">
            {name.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 text-left">
        <p className="font-medium">{name}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </button>
  );
}