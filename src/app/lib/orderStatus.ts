export type OrderStatus = "new" | "confirmed" | "shipped" | "delivered" | "cancelled";

const STATUS_STYLES: Record<OrderStatus, string> = {
  new: "bg-blue-500/10 text-blue-400 border-blue-500/30",
  confirmed: "bg-purple-500/10 text-purple-400 border-purple-500/30",
  shipped: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
  delivered: "bg-green-500/10 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/10 text-red-400 border-red-500/30",
};

// Localized status label — routed through the same i18n `status.*` keys the
// order-tracking stepper uses, so labels are consistent and translated.
export function orderStatusLabel(status: string, t: (key: string) => string): string {
  return t(`status.${status}`);
}

export function orderStatusStyle(status: string): string {
  return STATUS_STYLES[status as OrderStatus] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/30";
}
