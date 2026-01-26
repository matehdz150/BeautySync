// payments/services/calculatePaymentTotals.ts
export function calculatePaymentTotals(items: { amountCents: number }[]) {
  const subtotal = items
    .filter((i) => i.amountCents > 0)
    .reduce((sum, i) => sum + i.amountCents, 0);

  const discounts = items
    .filter((i) => i.amountCents < 0)
    .reduce((sum, i) => sum + i.amountCents, 0);

  const total = subtotal + discounts;

  if (total <= 0) {
    throw new Error('Payment total must be greater than zero');
  }

  return {
    subtotalCents: subtotal,
    discountsCents: discounts,
    taxCents: 0,
    totalCents: total,
  };
}
