"use client";

import { useEffect, useRef } from "react";
import { useParams } from "next/navigation";

import { usePayment } from "@/context/PaymentContext";
import { useBranch } from "@/context/BranchContext";

import CheckoutPage from "../page";

export default function CheckoutPageId() {
  const { id } = useParams<{ id: string }>();

  const { openBookingPayment } = usePayment();
  const { branch } = useBranch();

  const initialized = useRef(false);

  useEffect(() => {
    if (!id || !branch || initialized.current) return;

    initialized.current = true;

    openBookingPayment({
      organizationId: branch.organizationId,
      branchId: branch.id,
      bookingId: id,
    });
  }, [id, branch, openBookingPayment]);

  return <CheckoutPage appointmentId={id} />;
}