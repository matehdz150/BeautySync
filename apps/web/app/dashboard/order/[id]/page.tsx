"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { DateTime } from "luxon";

import { usePayment } from "@/context/PaymentContext";
import { getAppointmentById } from "@/lib/services/appointments";
import { getPaymentsByAppointment } from "@/lib/services/payments";

import CheckoutPage from "../page";
import { PaidOrderPage } from "./PaidOrderPage";

export default function CheckoutPageId() {
  const { id } = useParams<{ id: string }>();
  const { dispatch } = usePayment();

  const initialized = useRef(false);
  const [appointment, setAppointment] = useState<any>(null);
  const [payment, setPayment] = useState<any>(null);

  function formatAppointmentRange(
    startISO: string,
    endISO: string,
    zone = "America/Mexico_City"
  ) {
    const start = DateTime.fromISO(startISO, { zone: "utc" })
      .setZone(zone)
      .setLocale("es");

    const end = DateTime.fromISO(endISO, { zone: "utc" })
      .setZone(zone)
      .setLocale("es");

    const dateLabel = start
      .toFormat("cccc d LLLL")
      .replace(/^./, (c) => c.toUpperCase());

    return `${dateLabel} · ${start.toFormat("HH:mm")} – ${end.toFormat("HH:mm")}`;
  }

  useEffect(() => {
    if (!id || initialized.current) return;

    async function load() {
      const a = await getAppointmentById(id);
      if (!a) return;

      setAppointment(a);

      // 🟢 SI YA ESTÁ PAGADO → CARGAR PAYMENT Y SALIR
      if (a.paymentStatus === "PAID") {
        const p = await getPaymentsByAppointment(id);
        setPayment(p);
        return;
      }

      // 🔵 NO ESTÁ PAGADO → INICIALIZAR CONTEXTO
      initialized.current = true;
      dispatch({ type: "RESET_PAYMENT" });

      if (a.client) {
        dispatch({ type: "SET_CLIENT", payload: a.client });
      }

      dispatch({ type: "SET_STAFF", payload: a.staff });

      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: a.id,
          label: a.service.name,
          type: "service",
          amount: a.priceCents / 100,
          staff: a.staff,
          date: formatAppointmentRange(a.start, a.end),
          duration: a.service.durationMin,
          meta: {
            color: a.service.categoryColor,
            durationMin: a.service.durationMin,
            icon: a.service.categoryIcon,
          },
        },
      });

      dispatch({
        type: "SET_PAYMENT_METHOD",
        payload: "terminal",
      });
    }

    load();
  }, [id, dispatch]);

  /* =====================
     RENDER DECISION
  ===================== */

  if (!appointment) return null;

  // 🟢 YA PAGADO
  if (appointment.paymentStatus === "PAID" && payment) {
    return <PaidOrderPage payment={payment} />;
  }

  // 🔵 NO PAGADO
  return <CheckoutPage appointmentId={id} />;
}