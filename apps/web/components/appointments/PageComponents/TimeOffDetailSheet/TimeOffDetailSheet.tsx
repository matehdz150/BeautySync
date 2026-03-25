"use client";

import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

import { useCalendar, useCalendarActions } from "@/context/CalendarContext";
import { useBranch } from "@/context/BranchContext";

import { getStaffTimeOffDetail } from "@/lib/services/staff-time-off";

export function BlockDetailSheet() {
  const { state } = useCalendar();
  const { closeBlockDetail } = useCalendarActions();
  const { branch } = useBranch();

  const open = state.BlockDetailOpen;
  const blockId = state.selectedBlockId;

  const timeoff = state.timeOffs.find((t) => t.id === blockId);

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // ============================
  // LOAD DETAIL
  // ============================
  useEffect(() => {
    if (!blockId || !timeoff || !branch?.id) return;

    let cancelled = false;

    async function load() {
      setLoading(true);
      setNotFound(false);

      try {
        const timeOffId = Number(blockId.replace("timeoff-", ""));

        const res = await getStaffTimeOffDetail({
          timeOffId,
          staffId: timeoff.staffId,
          branchId: branch.id,
        });

        if (!cancelled) {
          setData(res);
        }
      } catch (e) {
        if (!cancelled) {
          setData(null);
          setNotFound(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [blockId, timeoff, branch?.id]);

  return (
    <Sheet
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setTimeout(() => {
            closeBlockDetail();
          }, 200);
        }
      }}
    >
      <SheetContent
        side="right"
        className="w-full !max-w-[30rem] flex flex-col bg-white"
      >
        <VisuallyHidden>
          <SheetTitle>Detalle bloqueo</SheetTitle>
        </VisuallyHidden>

        <div className="p-6 space-y-4">
          {/* ⏳ LOADING */}
          {loading && (
            <p className="text-sm text-muted-foreground">
              Cargando bloqueo…
            </p>
          )}

          {/* ❌ NOT FOUND */}
          {!loading && notFound && (
            <p className="text-sm text-muted-foreground">
              No se encontró el bloqueo
            </p>
          )}

          {/* ✅ DATA */}
          {!loading && data && (
            <>
              <div className="space-y-1">
                <p className="text-sm font-medium">
                  ID: {data.timeOff.id}
                </p>
                <p className="text-sm text-muted-foreground">
                  Staff: {data.timeOff.staffId}
                </p>
                <p className="text-sm">
                  Inicio: {data.timeOff.start}
                </p>
                <p className="text-sm">
                  Fin: {data.timeOff.end}
                </p>
                <p className="text-sm">
                  Motivo: {data.timeOff.reason ?? "Sin motivo"}
                </p>
              </div>

              {/* RULES */}
              <div className="pt-4 space-y-2">
                <p className="text-sm font-semibold">Reglas</p>

                {data.rules.length === 0 && (
                  <p className="text-sm text-muted-foreground">
                    No hay reglas
                  </p>
                )}

                {data.rules.map((r: any) => (
                  <div
                    key={r.id}
                    className="border rounded-md p-3 text-sm space-y-1"
                  >
                    <p className="font-medium">
                      {r.recurrenceType}
                    </p>

                    <p>
                      {r.startTime} - {r.endTime}
                    </p>

                    {r.daysOfWeek?.length > 0 && (
                      <p>
                        Días: {r.daysOfWeek.join(", ")}
                      </p>
                    )}

                    <p className="text-muted-foreground">
                      {r.reason ?? "Sin motivo"}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}