"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";

import { usePayment } from "@/context/PaymentContext";
import { useBranch } from "@/context/BranchContext";

import CheckoutPage from "../page";
import { PaidOrderPage } from "./PaidOrderPage";

import { Payment as ApiPayment } from "@/lib/services/payments";

export default function CheckoutPageId() {
  const params = useParams();
  const bookingId = params?.id as string;

  const { openBookingPayment } = usePayment();
  const { branch } = useBranch();

  const [payment, setPayment] = useState<ApiPayment | null>(null);
  const [loading, setLoading] = useState(true);

  const initialized = useRef(false);

  useEffect(() => {
    if (!bookingId || !branch || initialized.current) return;

    initialized.current = true;

    const currentBranch = branch;

    async function load() {
      try {
        const p = await openBookingPayment({
          organizationId: currentBranch.organizationId,
          branchId: currentBranch.id,
          bookingId,
        });

        setPayment(p);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [bookingId, branch, openBookingPayment]);

  if (loading) return null;

  if (!payment) return null;

  if (payment.status === "paid") {
    return <PaidOrderPage payment={payment} />;
  }

  return <CheckoutPage appointmentId={bookingId} />;
}