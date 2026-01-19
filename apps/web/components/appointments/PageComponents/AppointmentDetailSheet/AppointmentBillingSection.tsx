"use client";

import { useEffect, useState } from "react";
import { getPaymentsByAppointment } from "@/lib/services/payments";
import { DateTime } from "luxon";
import { cn } from "@/lib/utils";
import { UnpaidServicePreview } from "./UnpaidServicePreview";
import { PaidReceiptPreview } from "./PaidReciptReview";

type Props = {
  appointmentId: string;
  paymentStatus?: "PAID" | string;
  fallbackService: {
    name: string;
    color?: string;
    staffName?: string;
    minutes?: number;
    start?: DateTime;
    priceCents: number;
  };
};

export function AppointmentBillingSection({
  appointmentId,
  paymentStatus,
  fallbackService,
}: Props) {
  const [payment, setPayment] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const isPaid = paymentStatus === "PAID";

  useEffect(() => {
    if (!isPaid) return;

    async function load() {
      setLoading(true);
      const p = await getPaymentsByAppointment(appointmentId);
      setPayment(p);
      setLoading(false);
    }

    load();
  }, [isPaid, appointmentId]);

  if (!isPaid) {
    return <UnpaidServicePreview {...fallbackService} />;
  }

  if (loading || !payment) {
    return <p className="text-sm text-muted-foreground">Cargando pago…</p>;
  }

  return <PaidReceiptPreview payment={payment} />;
}