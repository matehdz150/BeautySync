"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

import {
  AppointmentBuilderProvider,
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
import { CalendarAppointment } from "@/app/dashboard/appointments/Calendar";

function InnerSheet({ open, onOpenChange, onAppointmentsCreated }: any) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const { services, clear, client } = useAppointmentBuilder();
  const { branch } = useBranch();
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setStep(1);
      clear();
    }
  }, [open]);

  async function handleConfirmBooking() {
    if (!branch) return;

    const ready = services.every((s) => s.staffId && s.startISO);
    if (!ready) return;

    // 1️⃣ CREA EN BACKEND
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

    // 2️⃣ NORMALIZA PARA EL CALENDARIO
    const enriched: CalendarAppointment[] = created.map((a, i) => {
      const s = services[i];

      const start = DateTime.fromISO(a.start);
      const end = DateTime.fromISO(a.end);

      return {
        id: a.id,

        staffId: a.staffId,
        staffName: s.staffName ?? "Staff",

        client: client?.name ?? "Cliente",

        service: s.service.name,
        serviceColor: s.service.category?.colorHex ?? "#A78BFA",

        startISO: a.start,
        endISO: a.end,

        startTime: start.toLocal().toFormat("H:mm"),
        minutes: end.diff(start, "minutes").minutes,
      };
    });

    // 3️⃣ ENVÍA AL CALENDARIO
    onAppointmentsCreated(enriched);

    clear();
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full !max-w-[52rem] bg-white">
        <div className="flex h-full">
          {/* LEFT: CLIENT SIDEBAR */}
          <ClientSidebar />

          {/* RIGHT: MAIN WIZARD */}
          <div className="flex-1 flex flex-col">
            <SheetHeader className="px-6 py-4 text-2xl">
              <SheetTitle>
                {step === 1 && "Select a service"}
                {step === 2 && "Services"}
                {step === 3 && "Select a time"}
              </SheetTitle>
            </SheetHeader>

            <div className="flex-1 px-6 pb-6 overflow-y-auto">
              {step === 1 && <StepServices onSelect={() => setStep(2)} />}

              {step === 2 && (
                <StepServiceSummary
                  onContinue={() => setStep(3)}
                  onAddService={() => setStep(1)}
                  onEditTimes={(serviceId) => {
                    setEditingServiceId(serviceId);
                    setStep(3);
                  }}
                />
              )}

              {step === 3 && (
                <StepTime
                  onBack={() => setStep(2)}
                  onDone={() => setStep(4)}
                  editingServiceId={editingServiceId}
                  setEditingServiceId={setEditingServiceId}
                />
              )}

              {step === 4 && (
                <StepConfirm
                  onBack={() => setStep(3)}
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
