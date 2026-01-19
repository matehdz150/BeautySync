"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Shuffle, Users } from "lucide-react";

import { usePublicBooking } from "@/context/PublicBookingContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { CategoryIcon } from "@/components/shared/Icon";

/* =====================
   TYPES
===================== */

type PublicStaff = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type ScreenMode = "DECISION" | "BY_SERVICE";

function formatMoneyMXN(cents: number | null | undefined) {
  if (!cents || cents <= 0) return "Gratis";
  return `$${Math.round(cents / 100)} MXN`;
}

/* =====================
   MOBILE PAGE
===================== */

export function PublicStaffMobilePage() {
  const { branch, services, catalog, staffByService, dispatch } =
    usePublicBooking();

  const router = useRouter();

  const [screen, setScreen] = useState<ScreenMode>("DECISION");
  const [staffMap, setStaffMap] = useState<Record<string, PublicStaff[]>>({});
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* =====================
     INIT ACTIVE SERVICE
  ===================== */
  useEffect(() => {
    if (!activeServiceId && services.length > 0) {
      setActiveServiceId(services[0]);
    }
  }, [services, activeServiceId]);

  /* =====================
     FETCH STAFF
  ===================== */
  useEffect(() => {
    async function run() {
      if (!branch?.slug || services.length === 0) return;

      setLoading(true);

      try {
        const { getPublicStaffForService } = await import(
          "@/lib/services/public/staff"
        );

        const res = await Promise.all(
          services.map(async (serviceId) => {
            const staff = await getPublicStaffForService({
              slug: branch.slug,
              serviceId,
            });
            return { serviceId, staff };
          })
        );

        const map: Record<string, PublicStaff[]> = {};
        res.forEach(({ serviceId, staff }) => {
          map[serviceId] = staff;
        });

        setStaffMap(map);

        // unique staff catalog
        const unique = new Map<string, PublicStaff>();
        Object.values(map).forEach((list) => {
          list.forEach((st) => unique.set(st.id, st));
        });

        dispatch({
          type: "SET_STAFF_CATALOG",
          payload: Array.from(unique.values()),
        });
      } finally {
        setLoading(false);
      }
    }

    run();
  }, [branch?.slug, services, dispatch]);

  /* =====================
     GLOBAL STAFF
  ===================== */
  const globalStaff = useMemo(() => {
    if (services.length === 0) return [];

    for (const id of services) {
      if (!Array.isArray(staffMap[id])) return [];
    }

    // staff that exists in all selected services
    return staffMap[services[0]].filter((staff) =>
      services.every((serviceId) =>
        staffMap[serviceId].some((s) => s.id === staff.id)
      )
    );
  }, [services, staffMap]);

  /* =====================
     NAVIGATION
  ===================== */
  function goToDatetime() {
    dispatch({ type: "NEXT_STEP" });
    router.push("datetime"); // relative dentro de /book/.../staff
  }

  /* =====================
     ACTIONS
  ===================== */
  function chooseGlobalStaff(staffId: string) {
    services.forEach((serviceId) => {
      dispatch({
        type: "SET_STAFF_FOR_SERVICE",
        payload: { serviceId, staffId },
      });
    });

    goToDatetime();
  }

  function chooseAny() {
    services.forEach((serviceId) => {
      dispatch({
        type: "SET_STAFF_FOR_SERVICE",
        payload: { serviceId, staffId: "ANY" },
      });
    });

    goToDatetime();
  }

  function chooseByService() {
    setScreen("BY_SERVICE");
  }

  function selectStaff(serviceId: string, staffId: string) {
    dispatch({
      type: "SET_STAFF_FOR_SERVICE",
      payload: { serviceId, staffId },
    });

    const index = services.indexOf(serviceId);
    for (let i = index + 1; i < services.length; i++) {
      if (!staffByService[services[i]]) {
        setActiveServiceId(services[i]);
        return;
      }
    }

    goToDatetime();
  }

  /* =====================
     UI STATES
  ===================== */
  if (!branch) return <div className="p-6">Sucursal no encontrada</div>;
  if (loading) return <div className="p-6">Cargando profesionales…</div>;

  return (
    <div className="relative min-h-dvh bg-white overflow-hidden">
      {/* glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-124 h-40 w-40 -translate-x-1/2 rounded-full blur-3xl
  bg-gradient-to-b from-indigo-400/90 via-indigo-400/85  "
      />

      {/* =========================
          HEADER STICKY
      ========================= */}
      <div className="sticky top-0 z-40 bg-white/92 backdrop-blur-md border-b border-black/5">
        <div className="px-4 py-4 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="rounded-full border border-black/10 shadow-none shrink-0"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>

          <div className="min-w-0">
            <h1 className="text-lg font-semibold leading-tight truncate">
              Selecciona profesional
            </h1>
            <p className="text-xs text-muted-foreground truncate">
              {services.length} servicio(s) seleccionados
            </p>
          </div>
        </div>

        {/* =========================
            SERVICE TABS (only in BY_SERVICE)
        ========================= */}
        {screen === "BY_SERVICE" && (
          <div className="px-4 pb-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar">
              {services.map((id) => {
                const service = catalog.find((s) => s.id === id);
                const active = id === activeServiceId;
                const assigned = !!staffByService[id];

                return (
                  <button
                    key={id}
                    onClick={() => setActiveServiceId(id)}
                    className={cn(
                      "shrink-0 rounded-full px-4 py-2 text-sm font-medium border transition flex items-center gap-2",
                      active
                        ? "bg-black text-white border-black"
                        : "bg-white border-black/10 hover:bg-black/5"
                    )}
                  >
                    <span className="whitespace-nowrap truncate max-w-[180px]">
                      {service?.name ?? "Servicio"}
                    </span>

                    {assigned && <Check className="w-4 h-4" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* =========================
          CONTENT
      ========================= */}
      <div className="px-4 pt-4 pb-28 space-y-3">
        {/* DECISION MODE */}
        {screen === "DECISION" && (
          <>
            <StaffCardMobile
              name="Cualquiera"
              selected={false}
              onClick={chooseAny}
              variant="any"
              description="Asignaremos automáticamente al mejor disponible"
            />
            {globalStaff.length > 0 && (
              <>
                {globalStaff.map((staff) => (
                  <StaffCardMobile
                    key={staff.id}
                    name={staff.name}
                    avatarUrl={staff.avatarUrl}
                    selected={false}
                    onClick={() => chooseGlobalStaff(staff.id)}
                    description="Puede realizar todos los servicios"
                  />
                ))}
              </>
            )}

            <StaffCardMobile
              name="Elegir profesional por servicio"
              selected={false}
              onClick={chooseByService}
              variant="by-service"
              description="Asigna un profesional distinto para cada servicio"
            />
          </>
        )}

        {/* BY SERVICE MODE */}
        {screen === "BY_SERVICE" && activeServiceId && (
          <>
            <div className="rounded-3xl border border-black/10 bg-white p-4">
              <p className="text-sm font-semibold">Servicio activo</p>

              <div className="mt-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {catalog.find((s) => s.id === activeServiceId)?.name ??
                      "Servicio"}
                  </p>

                  <p className="text-xs text-muted-foreground mt-1">
                    {catalog.find((s) => s.id === activeServiceId)
                      ?.durationMin ?? 0}{" "}
                    min ·{" "}
                    {formatMoneyMXN(
                      catalog.find((s) => s.id === activeServiceId)?.priceCents
                    )}
                  </p>
                </div>

                <div className="h-10 w-10 rounded-full border border-black/10 bg-white flex items-center justify-center shrink-0">
                  <CategoryIcon
                    name={
                      catalog.find((s) => s.id === activeServiceId)?.category
                        ?.icon
                    }
                    className="w-5 h-5 text-indigo-400"
                  />
                </div>
              </div>
            </div>

            <StaffCardMobile
              name="Cualquiera"
              selected={staffByService[activeServiceId] === "ANY"}
              onClick={() => selectStaff(activeServiceId, "ANY")}
              variant="any"
              description="Asignaremos automáticamente"
            />

            {(staffMap[activeServiceId] ?? []).map((staff) => (
              <StaffCardMobile
                key={staff.id}
                name={staff.name}
                avatarUrl={staff.avatarUrl}
                selected={staffByService[activeServiceId] === staff.id}
                onClick={() => selectStaff(activeServiceId, staff.id)}
              />
            ))}

            {(staffMap[activeServiceId] ?? []).length === 0 && (
              <div className="rounded-2xl border border-black/10 bg-white p-5">
                <p className="text-sm font-medium">Sin profesionales</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este servicio no tiene profesionales disponibles.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* =====================
   STAFF CARD (MOBILE)
===================== */

function StaffCardMobile({
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
        "w-full rounded-2xl border px-4 py-4 text-left transition active:scale-[0.99]",
        selected
          ? "border-indigo-500 bg-indigo-50"
          : "border-black/10 bg-white hover:bg-black/[0.02]"
      )}
    >
      <div className="flex items-center justify-between gap-4">
        {/* left */}
        <div className="min-w-0 flex items-center gap-3">
          <div
            className={cn(
              "h-11 w-11 rounded-2xl border border-black/10 bg-white flex items-center justify-center shrink-0 overflow-hidden",
              isAny && "bg-indigo-500 border-indigo-500 text-white",
              isByService && "bg-black border-black text-white"
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
              <span className="text-sm font-semibold">
                {name.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="min-w-0">
            <p className="text-base font-semibold truncate">{name}</p>
            {description && (
              <p className="mt-1 text-xs text-muted-foreground leading-snug">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* right */}
        <div className="shrink-0">
          {selected ? (
            <div className="h-7 w-7 rounded-full bg-indigo-500 text-white flex items-center justify-center">
              <Check className="h-4 w-4" />
            </div>
          ) : (
            <div className="h-7 w-7 rounded-full border border-black/10 bg-white" />
          )}
        </div>
      </div>
    </button>
  );
}
