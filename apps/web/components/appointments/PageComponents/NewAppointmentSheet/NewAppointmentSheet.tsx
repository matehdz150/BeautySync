"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { StepConfirm } from "./Steps/StepConfirm";

import { useBranch } from "@/context/BranchContext";
import { DateTime } from "luxon";

import { useCalendarActions } from "@/context/CalendarContext";
import { ClientHeaderBar } from "./Steps/ClientSide/ClientHeaderBar";

import { buildBookingSuccessAlert } from "@/lib/ui/bookingAlerts";

import {
  BookingManagerDraftProvider,
  useBookingManagerDraft,
} from "@/context/BookingManagerDraftContext";

// 👇 nuevos steps
import { StepStaff } from "./Steps/StepStaff";
import { StepPlan } from "./Steps/StepPlan";

// 👇 nuevos endpoints
import { createManagerBooking } from "@/lib/services/appointments";
import { useUIAlerts } from "@/context/UIAlertsContext";

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
  const [isSubmitting, setIsSubmitting] = useState(false);

  // legacy context (lo seguimos usando para client / clear UI actual)
  const { client, clear } = useAppointmentBuilder();
  const { showAlert } = useUIAlerts();

  // draft context (SOURCE OF TRUTH para steps)
  const { state: draft, actions: draftActions } = useBookingManagerDraft();

  const { branch } = useBranch();
  const { addAppointments } = useCalendarActions();

  // ¿Venimos del grid?
  const fromGrid = !!(defaultStaffId && startISO && presetServices?.length);

  // reset de pasos / estado al abrir/cerrar
  const wasOpen = useRef(false);
  useEffect(() => {
    if (open && !wasOpen.current) {
      wasOpen.current = true;
      setStep(1);
    }

    if (!open && wasOpen.current) {
      wasOpen.current = false;

      // reset legacy UI
      clear();

      // reset draft
      draftActions.reset();

      setStep(1);
    }
  }, [open, clear, draftActions]);

  // ============================
  // ✅ VALIDACIONES POR STEP (DRAFT)
  // ============================

  const step1Valid = useMemo(() => {
    // mínimo 1 servicio seleccionado
    return draft.services.length >= 1;
  }, [draft.services.length]);

  const step2Valid = useMemo(() => {
    // regla: staff ready según tu draft
    return step1Valid && draftActions.isStep3Ready();
  }, [step1Valid, draftActions]);

  const step3Valid = useMemo(() => {
    // regla: ya hay fecha + plan seleccionado
    return step2Valid && !!draft.date && !!draft.selectedPlanStartIso;
  }, [step2Valid, draft.date, draft.selectedPlanStartIso]);

  const canContinue = useMemo(() => {
    if (fromGrid) {
      // grid flow: step1 -> step4 (confirm)
      if (step === 1) return step1Valid;
      return true;
    }

    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    if (step === 3) return step3Valid;
    if (step === 4) return true;

    return false;
  }, [fromGrid, step, step1Valid, step2Valid, step3Valid]);

  const canGoBack = useMemo(() => step !== 1, [step]);

  // ============================
  // ✅ ACCIONES CONTINUE / BACK
  // ============================

  function handleBack() {
    if (!canGoBack) return;

    if (fromGrid) {
      if (step === 4) return setStep(1);
      return setStep(1);
    }

    if (step === 2) return setStep(1);
    if (step === 3) return setStep(2);
    if (step === 4) return setStep(3);
  }

  function handleContinue() {
    if (!canContinue) return;

    if (fromGrid) {
      if (step === 1) return setStep(4);
      return;
    }

    if (step === 1) return setStep(2);
    if (step === 2) return setStep(3);
    if (step === 3) return setStep(4);
  }

  // ============================
  // ✅ CONFIRMAR BOOKING (MANAGER)
  // ============================

  async function handleConfirmBooking() {
    if (isSubmitting) return;

    // 🔥 IMPORTANTE: branch.id debe existir
    if (!branch?.id) {
      console.error("[CONFIRM] Missing branch.id", { branch });
      return;
    }

    // 🔥 IMPORTANTE: draft.date es requerido por el DTO
    if (!draft.date) {
      console.error("[CONFIRM] Missing draft.date", { draft });
      return;
    }

    // plan seleccionado
    const selectedPlan = draftActions.getSelectedPlan();
    if (!selectedPlan) {
      console.error("[CONFIRM] Missing selectedPlan");
      return;
    }

    // 🔥 NO puede haber ANY aquí (tu DTO dice staffId UUID)
    const hasAny = selectedPlan.assignments.some((a) => a.staffId === "ANY");
    if (hasAny) {
      console.error(
        "[CONFIRM] Plan has ANY staffId, invalid for manager booking"
      );
      return;
    }

    setIsSubmitting(true);

    try {
      // payload EXACTO al DTO de tu API (NO cambiar)
      const payload = {
        branchId: branch.id,
        clientId: draft.clientId ?? client?.id ?? null,
        date: draft.date!,
        notes: draft.notes ?? null,

        appointments: selectedPlan.assignments.map((a) => ({
          serviceId: a.serviceId,
          staffId: a.staffId, // UUID
          startIso: a.startIso, // UTC ISO
          durationMin: a.durationMin, // opcional
        })),
      };

      console.log("[CONFIRM] createManagerBooking payload:", payload);

      const res = await createManagerBooking(payload);

      // ✅ ENRICHED CORRECTO PARA CALENDAR (UTC REAL)
      const enriched = selectedPlan.assignments.map((a, index) => {
        const service = draft.services.find((s) => s.id === a.serviceId);

        const startUtc = DateTime.fromISO(a.startIso);
        const endUtc = a.endIso
          ? DateTime.fromISO(a.endIso)
          : startUtc.plus({ minutes: a.durationMin ?? 0 });

        return {
          // 🔑 USAR appointmentId REAL DEL BACKEND
          id: res.appointmentIds[index],

          // 🔑 GUARDAR bookingId
          bookingId: res.publicBookingId,

          staffId: a.staffId,
          staffName: "Staff",

          client: client?.name ?? "Cliente",

          serviceName: service?.name ?? "Servicio",
          serviceColor:
            service?.category?.colorHex ??
            (service as any)?.categoryColor ??
            "#A78BFA",

          priceCents: service?.priceCents ?? 0,

          startISO: startUtc.toISO()!,
          endISO: endUtc.toISO()!,
          startTime: startUtc.toLocal().toFormat("H:mm"),
          minutes: Math.round(endUtc.diff(startUtc, "minutes").minutes),
        };
      });

      addAppointments(enriched);

      // limpiar todo
      clear();
      draftActions.reset();
      onOpenChange(false);
      // 🔔 Datos para la alerta
      const firstAppointment = selectedPlan.assignments[0];

      showAlert(
        buildBookingSuccessAlert({
          clientName: client?.name,
          startIso: firstAppointment.startIso,
        })
      );

      return res;
    } catch (e) {
      console.error("[CONFIRM] createManagerBooking failed:", e);
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  }

  // ============================
  // ✅ TITLES
  // ============================

  const title = useMemo(() => {
    if (step === 1) return "Select services";
    if (step === 2) return "Select staff";
    if (step === 3) return "Select date & time";
    return "Confirm";
  }, [step]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="
          w-full !max-w-[32rem] bg-white
          p-0
          flex flex-col
          h-[100dvh]
        "
      >
        {/* Header fijo */}
        <div className="border-b shrink-0">
          <ClientHeaderBar />
        </div>

        <div className="flex-1 flex flex-col min-h-0">
          <SheetHeader className="px-6 py-4 text-2xl shrink-0">
            <SheetTitle>{title}</SheetTitle>
          </SheetHeader>

          {/* Body scrolleable */}
          <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
            {step === 1 && <StepServices />}

            {!fromGrid && step === 2 && <StepStaff />}

            {!fromGrid && step === 3 && <StepPlan />}

            {step === 4 && (
              <StepConfirm
                onBack={handleBack}
                onConfirm={handleConfirmBooking}
              />
            )}
          </div>

          {/* Footer SIEMPRE visible */}
          {step !== 4 && (
            <div
              className="
                sticky bottom-0 z-20
                border-t bg-white
                px-6 py-4
                flex items-center justify-between
                shadow-[0_-6px_18px_rgba(0,0,0,0.06)]
                pb-[calc(env(safe-area-inset-bottom)+16px)]
              "
            >
              <button
                onClick={handleBack}
                disabled={!canGoBack}
                className={`text-sm ${
                  canGoBack ? "text-black" : "text-gray-400"
                }`}
              >
                Back
              </button>

              <button
                onClick={handleContinue}
                disabled={!canContinue}
                className={`
                  rounded-md px-4 py-2 text-sm font-medium
                  transition
                  ${
                    canContinue
                      ? "bg-black text-white hover:opacity-90"
                      : "bg-gray-200 text-gray-500"
                  }
                `}
              >
                Continue
              </button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function NewAppointmentSheet(props: any) {
  return (
    <BookingManagerDraftProvider>
      <AppointmentBuilderProvider>
        <InnerSheet {...props} />
      </AppointmentBuilderProvider>
    </BookingManagerDraftProvider>
  );
}
