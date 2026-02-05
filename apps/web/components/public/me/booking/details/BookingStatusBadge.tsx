// BookingStatusBadge.tsx
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  className: string;
  icon: React.ReactNode;
};

export function BookingStatusBadge({ label, className, icon }: Props) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold",
        className
      )}
    >
      {icon}
      {label}
    </div>
  );
}