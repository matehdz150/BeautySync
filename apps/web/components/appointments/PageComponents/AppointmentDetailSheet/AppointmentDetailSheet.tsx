"use client";

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCalendar, useCalendarActions } from "@/context/CalendarContext";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import { CalendarSync, ChevronDown, EllipsisVertical, RefreshCwOff } from "lucide-react";
import { usePayment } from "@/context/PaymentContext";
import { useRouter } from "next/navigation";
import { AppointmentBillingSection } from "./AppointmentBillingSection";

export default function AppointmentDetailSheet() {
  const router = useRouter();
  const { dispatch } = usePayment();
  const { state } = useCalendar();
  const { closeAppointment } = useCalendarActions();

  const a: any = state.selectedAppointment;
  console.log("SELECTED", state.selectedAppointment);
  const open = !!a;

  // 🛑 Si no hay cita → no calcules nada
  const start = a?.startISO
    ? DateTime.fromISO(a.startISO).toLocal()
    : undefined;

  const conceptualStatus = a?.conceptualStatus;

  const conceptualLabel =
    conceptualStatus === "past"
      ? "Finalizada"
      : conceptualStatus === "ongoing"
      ? "En curso"
      : "Proxima";

  function handlePay() {
    if (!a) return;
    router.push(`/dashboard/order/${a.id}`);
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && closeAppointment()}>
      <SheetContent
        side="right"
        className={cn(
          "w-full !max-w-[30rem] flex flex-col",
          a?.raw?.paymentStatus === "PAID" ? "bg-gray-50" : "bg-white"
        )}
      >
        {!a ? null : (
          <div className="flex h-full">
            {/* 👉 LEFT CLIENT SIDEBAR */}

            {/* 👉 MAIN PANEL */}
            <div className="flex-1 flex flex-col">
              <SheetHeader className="text-left px-5 py-8 bg-indigo-400">
                <SheetTitle className="text-white">
                  {a.client ?? "Client"}
                </SheetTitle>

                <SheetDescription className="text-white w-full flex items-center justify-between">
                  {start && (
                    <>
                      {start.toFormat("ccc d LLL")} • {start.toFormat("t")}
                    </>
                  )}
                  <Button variant={"outline"} className="bg-transparent">
                    Ver cliente
                    <ChevronDown />
                  </Button>
                </SheetDescription>
              </SheetHeader>

              <div className="flex flex-col gap-6 flex-1 overflow-y-auto">
                <div className="px-5 py-4">
                  <div className="pb-2 pt-3">
                    <span
                      className={cn(
                        "px-5 py-2 text-sm capitalize transition-all",
                        conceptualStatus === "ongoing" &&
                          "bg-black text-white rounded-2xl",
                        conceptualStatus === "past" &&
                          "bg-white text-black border rounded-2xl",
                        conceptualStatus !== "ongoing" &&
                          conceptualStatus !== "past" &&
                          "bg-indigo-50 text-indigo-700 rounded-full"
                      )}
                    >
                      {conceptualLabel}
                    </span>
                  </div>
                  <AppointmentBillingSection
                    appointmentId={a.id}
                    paymentStatus={a?.raw?.paymentStatus}
                    fallbackService={{
                      name: a?.serviceName,
                      color: a?.serviceColor,
                      staffName: a?.staffName,
                      minutes: a?.minutes,
                      start,
                      priceCents: a.priceCents
                    }}
                  />
                </div>

                <div className="flex-1" />
                <div className="border-t p-4 space-y-3">
                  {a?.raw?.paymentStatus === "PAID" ? (
                    <>
                      {/* ===== PAID STATE ===== */}
                      <Button
                        variant="default"
                        className="w-full py-6 shadow-none"
                        onClick={() => {
                          router.push(`/dashboard/order/${a.id}`);
                        }}
                      >
                        Ver orden
                      </Button>
                    </>
                  ) : (
                    <>
                      {/* ===== UNPAID STATE ===== */}
                      <div className="flex justify-between text-sm">
                        <span className="font-semibold text-base">Total</span>
                        <span className="font-semibold text-base">
                          $
                          {(a.priceCents / 100).toFixed(2)}
                        </span>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="rounded-md py-6 shadow-none w-15"
                          tooltip="Cancelar cita"
                        >
                          <RefreshCwOff />
                        </Button>
                         <Button
                          variant="outline"
                          className="rounded-md py-6 shadow-none w-15"
                          tooltip="Reagendar cita"
                        >

                         <CalendarSync/>
                        </Button>

                        <Button
                          className="flex-1 shadow-none py-6"
                          onClick={handlePay}
                        >
                          Pagar
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
