"use client";

import { useEffect, useMemo, useState } from "react";
import { DateTime } from "luxon";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { useCalendar, useCalendarActions } from "@/context/CalendarContext";
import { useBranch } from "@/context/BranchContext";
import { useTimeOffActions } from "@/context/TimeOffDraftContext";

import { getStaffTimeOffDetail } from "@/lib/services/staff-time-off";
import { StaffTimeOffSheet } from "../StaffTimeOutSheet/StaffTimeOffSheet";

const WEEK_DAYS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

export function BlockDetailSheet() {
  const { state } = useCalendar();
  const { closeBlockDetail } = useCalendarActions();
  const { branch } = useBranch();

  const { dispatch } = useTimeOffActions();

  const open = state.BlockDetailOpen;
  const blockId = state.selectedBlockId;

  const timeoff = state.timeOffs.find((t) => t.id === blockId);

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);

  // ============================
  // HELPERS
  // ============================

  function formatDate(iso: string) {
    return DateTime.fromISO(iso)
      .setZone("America/Mexico_City")
      .toFormat("dd LLL yyyy");
  }

  function formatTime(iso: string) {
    return DateTime.fromISO(iso)
      .setZone("America/Mexico_City")
      .toFormat("HH:mm");
  }

  function formatRange(start: string, end: string) {
    return `${formatTime(start)} - ${formatTime(end)}`;
  }

  function formatDays(days: number[]) {
    return days.map((d) => WEEK_DAYS[d]).join(", ");
  }

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

  // ============================
  // PREVIEW
  // ============================
  const preview = useMemo(() => {
    if (!data) return "";

    if (data.rules.length === 0) {
      return `${formatDate(data.timeOff.start)} · ${formatRange(
        data.timeOff.start,
        data.timeOff.end
      )}`;
    }

    const rule = data.rules[0];

    if (rule.recurrenceType === "DAILY") {
      return `Todos los días · ${rule.startTime} - ${rule.endTime}`;
    }

    if (rule.recurrenceType === "WEEKLY") {
      return `Semanal · ${formatDays(rule.daysOfWeek ?? [])} · ${rule.startTime} - ${rule.endTime}`;
    }

    return `${rule.recurrenceType} · ${rule.startTime} - ${rule.endTime}`;
  }, [data]);

  // ============================
  // EDIT (🔥 AQUÍ PASA TODO)
  // ============================
  function handleEdit() {
    if (!data) return;

    // 👉 1. hidratar contexto
    dispatch({
      type: "LOAD_FROM_TIMEOFF",
      payload: data,
    });

    // 👉 2. cerrar detail
    closeBlockDetail();

    // 👉 3. abrir editor
    setTimeout(() => {
      setOpenEdit(true);
    }, 200);
  }

  // ============================
  // DELETE
  // ============================
  function handleDelete() {
    if (!data) return;

    console.log("delete", data.timeOff.id);
    // 🔥 aquí después metes mutation real
  }

  // ============================
  // UI
  // ============================

  return (
    <>
      {/* ============================
          DETAIL
      ============================ */}
      <Sheet open={open} onOpenChange={closeBlockDetail}>
        <SheetContent className="w-full !max-w-[32rem] bg-white flex flex-col h-[100dvh] p-0">
          
          {/* HEADER */}
          <SheetHeader className="px-6 py-5 border-b text-left">
            <SheetTitle>Detalle del bloqueo</SheetTitle>
            <SheetDescription>{preview}</SheetDescription>
          </SheetHeader>

          {/* BODY */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            
            {loading && (
              <p className="text-sm text-muted-foreground">
                Cargando bloqueo…
              </p>
            )}

            {!loading && notFound && (
              <p className="text-sm text-muted-foreground">
                No se encontró el bloqueo
              </p>
            )}

            {!loading && data && (
              <>
                {/* FECHA */}
                <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Input
                    value={formatDate(data.timeOff.start)}
                    readOnly
                    className="py-5"
                  />
                </div>

                {/* HORAS */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Hora inicio</Label>
                    <Input
                      value={formatTime(data.timeOff.start)}
                      readOnly
                      className="py-5"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Hora fin</Label>
                    <Input
                      value={formatTime(data.timeOff.end)}
                      readOnly
                      className="py-5"
                    />
                  </div>
                </div>

                {/* STAFF */}
                <div className="space-y-2">
                  <Label>Staff</Label>
                  <Input
                    value={data.timeOff.staffId}
                    readOnly
                    className="py-5"
                  />
                </div>

                {/* RECURRENCIA */}
                {data.rules.length > 0 && (
                  <div className="space-y-2">
                    <Label>Repetición</Label>

                    {data.rules.map((r: any) => (
                      <div
                        key={r.id}
                        className="border rounded-xl p-4 space-y-2 text-sm"
                      >
                        <p className="font-medium">
                          {r.recurrenceType}
                        </p>

                        <p>
                          {r.startTime} - {r.endTime}
                        </p>

                        {r.daysOfWeek?.length > 0 && (
                          <p className="text-muted-foreground">
                            {formatDays(r.daysOfWeek)}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* MOTIVO */}
                <div className="space-y-2">
                  <Label>Motivo</Label>
                  <Input
                    value={data.timeOff.reason ?? ""}
                    readOnly
                    placeholder="Sin motivo"
                    className="py-5"
                  />
                </div>
              </>
            )}
          </div>

          {/* ACTIONS */}
          {!loading && data && (
            <div className="border-t px-6 py-4 flex gap-3 sticky bottom-0 bg-white">
              <Button
                variant="outline"
                className="w-full py-6"
                onClick={handleDelete}
              >
                Eliminar
              </Button>

              <Button
                className="w-full py-6"
                onClick={handleEdit}
              >
                Editar
              </Button>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* ============================
          EDIT (REUSA MISMO FORM)
      ============================ */}
      <StaffTimeOffSheet
        open={openEdit}
        onOpenChange={setOpenEdit}
        branchId={branch?.id ?? ""}
      />
    </>
  );
}