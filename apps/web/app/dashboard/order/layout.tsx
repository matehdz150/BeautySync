import { PaymentProvider } from "@/context/PaymentContext";

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <PaymentProvider>{children}</PaymentProvider>;
}