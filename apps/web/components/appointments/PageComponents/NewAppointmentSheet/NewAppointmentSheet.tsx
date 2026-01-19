"use client";

import { useEffect, useRef, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  AppointmentBuilderProvider,
  Service,
  useAppointmentBuilder,
} from "@/context/AppointmentBuilderContext";

import { StepServices } from "./Steps/StepServices";
import { StepServiceSummary } from "./Steps/StepServiceSummary";
import { StepTime } from "./Steps/StepTime";
import { createAppointment } from "@/lib/services/appointments";
import { useBranch } from "@/context/BranchContext";
import { DateTime } from "luxon";
import { ClientSidebar } from "./Steps/ClientSide/ClientSidebar";
import { StepConfirm } from "./Steps/StepConfirm";
import { useCalendarActions } from "@/context/CalendarContext";
import { ClientHeaderBar } from "./Steps/ClientSide/ClientHeaderBar";

type InnerProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultStaffId?: string;
  startISO?: string;
  presetServices?: Service[];
};

function InnerSheet({
  open,
  onOpenChange,
  defaultStaffId,
  startISO,
  presetServices,
}: InnerProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const { services, client, clear } = useAppointmentBuilder();
  const { branch } = useBranch();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const { addAppointments } = useCalendarActions();

  // ¿Venimos del grid?
  const fromGrid = !!(defaultStaffId && startISO && presetServices?.length);

  // reset de pasos / estado al abrir/cerrar
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      // se acaba de abrir
      wasOpen.current = true;
      setStep(1);
    }

    if (!open && wasOpen.current) {
      // se acaba de cerrar
      wasOpen.current = false;
      clear();
      setStep(1);
    }
  }, [open, clear]);

  async function handleConfirmBooking() {
    if (!branch) return;

    const ready = services.every((s) => s.staffId && s.startISO);
    if (!ready) return;

    const created = await Promise.all(
      services.map(async (s) => {
        const startUtc = DateTime.fromISO(s.startISO!, {
          zone: "America/Mexico_City",
        })
          .toUTC()
          .toISO();

        return await createAppointment({
          branchId: branch.id,
          serviceId: s.service.id,
          staffId: s.staffId!,
          start: startUtc,
          clientId: client?.id,
        });
      })
    );

    const enriched = created.map((a, i) => {
      const s = services[i];
      const start = DateTime.fromISO(a.start);
      const end = DateTime.fromISO(a.end);

      return {
        id: a.id,
        staffId: a.staffId,
        staffName: s.staffName ?? "Staff",
        client: client?.name ?? "Cliente",
        serviceName: s.service.name,
        serviceColor: s.service.category?.colorHex ?? "#A78BFA",
        priceCents: s.service.priceCents,
        startISO: a.start,
        endISO: a.end,
        startTime: start.toLocal().toFormat("H:mm"),
        minutes: end.diff(start, "minutes").minutes,
      };
    });

    addAppointments(enriched);
    clear();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full !max-w-[32rem] bg-white">
        <div className="flex flex-col h-full">
          <div className="border-b">
            <ClientHeaderBar />
          </div>

          <div className="flex-1 flex flex-col">
            <SheetHeader className="px-6 py-4 text-2xl">
              <SheetTitle>
                {step === 1 && "Select a service"}
                {step === 2 && "Services"}
                {step === 3 && "Select a time"}
                {step === 4 && "Confirm"}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 px-6 pb-6 overflow-y-auto">
              {step === 1 && (
                <StepServices
                  defaultStaffId={defaultStaffId}
                  startISO={startISO}
                  presetServices={presetServices}
                  // 👇 si vengo del grid → después de elegir servicio voy directo a Confirm
                  onSelect={() => setStep(fromGrid ? 4 : 2)}
                />
              )}

              {/* Flujo largo solo si NO venimos del grid */}
              {!fromGrid && step === 2 && (
                <StepServiceSummary
                  onContinue={() => setStep(3)}
                  onAddService={() => setStep(1)}
                  onEditTimes={(serviceId) => {
                    setEditingServiceId(serviceId);
                    setStep(3);
                  }}
                />
              )}

              {!fromGrid && step === 3 && (
                <StepTime
                  onBack={() => setStep(2)}
                  onDone={() => setStep(4)}
                  editingServiceId={editingServiceId}
                  setEditingServiceId={setEditingServiceId}
                />
              )}

              {step === 4 && (
                <StepConfirm
                  onBack={() => setStep(fromGrid ? 1 : 3)}
                  onConfirm={handleConfirmBooking}
                />
              )}
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function NewAppointmentSheet(props: any) {
  return (
    <AppointmentBuilderProvider>
      <InnerSheet {...props} />
    </AppointmentBuilderProvider>
  );
}
