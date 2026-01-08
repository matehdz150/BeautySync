"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

import { useBranch } from "@/context/BranchContext";
import { useAppointmentBuilder } from "@/context/AppointmentBuilderContext";
import { getAvailability } from "@/lib/services/availability";

import { getBusyRangesForDay, overlaps } from "@/lib/helpers/scheduling";
import { HorizontalDatePicker } from "./TimeSide/HorizontalDatePicker";

type Props = {
  onBack: () => void;
  onDone: () => void;
  editingServiceId: string | null;
  onChangeEditingServiceId: (id: string | null) => void;
};

export function StepTime({
  onBack,
  onDone,
  editingServiceId,
  onChangeEditingServiceId,
}: Props) {
  const { branch } = useBranch();
  const { services, updateStartISO } = useAppointmentBuilder();

  const [date, setDate] = useState<Date>(new Date());
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  // Servicio "actual" a editar / asignar
  const current = useMemo(() => {
    if (!services.length) return undefined;

    if (editingServiceId) {
      return services.find((s) => s.service.id === editingServiceId) ?? services[0];
    }

    // flujo normal: primer servicio sin hora, o el primero
    return services.find((s) => !s.startISO) ?? services[0];
  }, [services, editingServiceId]);

  // Todos tienen hora (para habilitar Continue)
  const allSelected = services.length > 0 && services.every((s) => s.startISO);

  // Busy ranges
  const busy = useMemo(() => {
    return getBusyRangesForDay(
      services,
      DateTime.fromJSDate(date).toISODate()
    );
  }, [services, date]);

  // Sincronizar la fecha con la hora del servicio actual (si ya tiene)
  useEffect(() => {
    if (!current?.startISO) return;
    const d = DateTime.fromISO(current.startISO).toJSDate();
    setDate(d);
  }, [current?.startISO]);

  // Cargar availability del servicio actual
  useEffect(() => {
    async function load() {
      if (!branch || !current?.service?.id || !current?.staffId) return;

      setLoading(true);

      const res = await getAvailability({
        branchId: branch.id,
        serviceId: current.service.id,
        staffId: current.staffId,
        date: DateTime.fromJSDate(date).toISODate(),
      });

      const m = res?.staff?.find((x) => x.staffId === current.staffId);

      setSlots(m?.slots ?? []);
      setLoading(false);
    }

    load();
  }, [branch, current?.service?.id, current?.staffId, date]);

  if (!current) {
    return (
      <div className="space-y-6">
        <p className="text-sm text-muted-foreground">Services &gt; Time</p>
        <p className="text-sm text-muted-foreground">
          No services selected yet.
        </p>

        <div className="border-t pt-4 flex justify-between">
          <Button variant="outline" onClick={onBack}>
            Back
          </Button>

          <Button disabled onClick={onDone}>
            Continue
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">Services &gt; Time</p>

      <h2 className="text-xl font-semibold">
        {allSelected && !editingServiceId
          ? "Confirm schedule"
          : `Select a time for ${current.service.name}`}
      </h2>

      <>
        {/* SERVICE SWITCHER */}
        <div className="flex gap-2 flex-wrap">
          {services.map((s) => {
            const active = s.service.id === current.service.id;

            return (
              <button
                key={s.service.id}
                type="button"
                onClick={() => onChangeEditingServiceId(s.service.id)}
                className={`
                  px-3 py-1 rounded-full border text-sm
                  ${
                    active
                      ? "bg-indigo-400 text-white border-indigo-400"
                      : "bg-white hover:bg-muted"
                  }
                `}
              >
                {s.service.name}

                {s.startISO && (
                  <span className="ml-2 opacity-70">
                    {DateTime.fromISO(s.startISO)
                      .setZone("America/Mexico_City")
                      .toFormat("h:mma")}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <HorizontalDatePicker value={date} onChange={setDate} />

        <p className="font-medium mt-2">Available times</p>

        {loading && (
          <>
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </>
        )}

        {!loading && (
          <div className="space-y-2">
            {slots.map((iso) => {
              const start = DateTime.fromISO(iso);
              const end = start.plus({
                minutes: current.service.durationMin,
              });

              const isBlocked = overlaps(start, end, busy);

              return (
                <button
                  key={iso}
                  type="button"
                  disabled={isBlocked}
                  className={`
                    w-full px-4 py-3 rounded-md border
                    ${
                      isBlocked
                        ? "opacity-40 cursor-not-allowed"
                        : "hover:bg-muted"
                    }
                  `}
                  onClick={() => {
                    if (isBlocked) return;

                    // ✅ solo actualiza la hora, NO auto avanza de servicio
                    updateStartISO(current.service.id, iso);
                  }}
                >
                  {start.setZone("America/Mexico_City").toFormat("h:mma")}
                </button>
              );
            })}
          </div>
        )}

        {!loading && slots.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No available times for this day
          </p>
        )}
      </>

      <div className="border-t pt-4 flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            onChangeEditingServiceId(null);
            onBack();
          }}
        >
          Back
        </Button>

        <Button disabled={!allSelected} onClick={onDone}>
          Continue
        </Button>
      </div>
    </div>
  );
}