"use client";

import { useEffect, useMemo, useState } from "react";
import { usePublicBooking } from "@/context/PublicBookingContext";
import { getPublicStaffForService } from "@/lib/services/public/staff";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, Shuffle, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

/* =====================
   TYPES
===================== */

type PublicStaff = {
  id: string;
  name: string;
  avatarUrl?: string;
};

type ScreenMode = "DECISION" | "BY_SERVICE";

/* =====================
   DESKTOP PAGE
===================== */

export default function PublicStaffDesktopPage() {
  const { branch, services, catalog, staffByService, dispatch } =
    usePublicBooking();

  const router = useRouter();

  const [screen, setScreen] = useState<ScreenMode>("DECISION");
  const [staffMap, setStaffMap] = useState<Record<string, PublicStaff[]>>({});
  const [activeServiceId, setActiveServiceId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  /* =====================
     NAV
  ===================== */
  const goToDatetime = () => {
    dispatch({ type: "NEXT_STEP" });
    router.push("datetime");
  };

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
    if (!branch?.slug || services.length === 0) return;

    setLoading(true);

    Promise.all(
      services.map(async (serviceId) => {
        const staff = await getPublicStaffForService({
          slug: branch.slug,
          serviceId,
        });
        return { serviceId, staff };
      })
    )
      .then((res) => {
        const map: Record<string, PublicStaff[]> = {};
        res.forEach(({ serviceId, staff }) => {
          map[serviceId] = staff;
        });

        setStaffMap(map);

        // staff catalog único
        const unique = new Map<string, PublicStaff>();
        Object.values(map).forEach((list) => {
          list.forEach((st) => unique.set(st.id, st));
        });

        dispatch({
          type: "SET_STAFF_CATALOG",
          payload: Array.from(unique.values()),
        });
      })
      .finally(() => setLoading(false));
  }, [branch?.slug, services, dispatch]);

  /* =====================
     GLOBAL STAFF
  ===================== */
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const globalStaff = useMemo(() => {
    if (services.length === 0) return [];

    for (const id of services) {
      if (!Array.isArray(staffMap[id])) return [];
    }

    return staffMap[services[0]].filter((staff) =>
      services.every((serviceId) =>
        staffMap[serviceId].some((s) => s.id === staff.id)
      )
    );
  }, [services, staffMap]);

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
  if (!branch) return <div className="p-10">Sucursal no encontrada</div>;
  if (loading) return <div className="p-10">Cargando profesionales…</div>;

  /* =====================
     RENDER
  ===================== */
  return (
    <div className="space-y-10 relative">
      {/* glow */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -top-60 h-125 w-255 -translate-x-1/2 z-0 rounded-full blur-3xl
             bg-gradient-to-b from-indigo-400/75 via-indigo-400/10 to-transparent"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(90px)" }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          y: [0, 10, 0],
          filter: ["blur(50px)", "blur(58px)", "blur(50px)"],
        }}
        transition={{
          opacity: { duration: 1.4, ease: "easeOut" },
          scale: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          y: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          filter: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
        }}
      />

      <motion.div
        aria-hidden
        className="pointer-events-none absolute left-7/12 top-160 h-125 w-255 -translate-x-1/2 z-0 rounded-full blur-3xl
             bg-gradient-to-b from-indigo-400/45 via-indigo-400/10 to-transparent"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(90px)" }}
        animate={{
          opacity: 1,
          scale: [1, 1.03, 1],
          y: [0, 10, 0],
          filter: ["blur(50px)", "blur(58px)", "blur(50px)"],
        }}
        transition={{
          opacity: { duration: 1.4, ease: "easeOut" },
          scale: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          y: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
          filter: { duration: 1.5, ease: "easeInOut", repeat: Infinity },
        }}
      />

      {/* HEADER */}
      <div className="flex items-center gap-3 relative z-10">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full border"
          onClick={() => router.back()}
        >
          <ArrowLeft />
        </Button>

        <h1 className="text-2xl font-semibold">Selecciona profesional</h1>
      </div>

      {/* ================= DECISION ================= */}
      {screen === "DECISION" && (
        <div className="space-y-4 relative z-10">
          {globalStaff.map((staff) => (
            <StaffCard
              key={staff.id}
              name={staff.name}
              avatarUrl={staff.avatarUrl}
              selected={false}
              onClick={() => chooseGlobalStaff(staff.id)}
              description="Este profesional puede realizar todos los servicios"
            />
          ))}

          <StaffCard
            name="Cualquiera"
            selected={false}
            onClick={chooseAny}
            variant="any"
            description="Asignaremos automáticamente al mejor disponible"
          />

          <StaffCard
            name="Elegir profesional por servicio"
            selected={false}
            onClick={chooseByService}
            variant="by-service"
            description="Asigna un profesional distinto para cada servicio"
          />
        </div>
      )}

      {/* ================= BY SERVICE ================= */}
      {screen === "BY_SERVICE" && activeServiceId && (
        <div className="space-y-6 relative z-10">
          <div className="flex gap-2 overflow-x-auto">
            {services.map((id) => {
              const service = catalog.find((s) => s.id === id);
              const active = id === activeServiceId;
              const assigned = !!staffByService[id];

              return (
                <button
                  key={id}
                  onClick={() => setActiveServiceId(id)}
                  className={cn(
                    "px-4 py-2 rounded-full border text-sm whitespace-nowrap",
                    active ? "bg-black text-white" : "bg-white"
                  )}
                >
                  {service?.name}
                  {assigned && <Check className="ml-2 inline w-4 h-4" />}
                </button>
              );
            })}
          </div>

          <div className="space-y-3">
            <StaffCard
              name="Cualquiera"
              selected={staffByService[activeServiceId] === "ANY"}
              onClick={() => selectStaff(activeServiceId, "ANY")}
              variant="any"
            />

            {(staffMap[activeServiceId] ?? []).map((staff) => (
              <StaffCard
                key={staff.id}
                name={staff.name}
                avatarUrl={staff.avatarUrl}
                selected={staffByService[activeServiceId] === staff.id}
                onClick={() => selectStaff(activeServiceId, staff.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* =====================
   STAFF CARD (DESKTOP)
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
      {/* AVATAR */}
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

      {/* TEXT */}
      <div className="flex-1 text-left">
        <p className="font-medium">{name}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
    </button>
  );
}