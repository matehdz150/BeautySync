"use client";

import { ActionRow } from "./ActionRow";
import { BookingDetailVM, BookingAction } from "./booking-types";
import { statusConfigMap } from "./status";

type Props = {
  booking: BookingDetailVM;
  cancelling: boolean;
  onCancel: () => Promise<void>;
};

export function BookingActions({ booking, cancelling, onCancel }: Props) {
  const config = statusConfigMap[booking.status];

  return (
    <div className="mt-6 space-y-1">
      {config.actions({ booking, cancelling }).map((action, i) => {
        if (action.type === "link") {
          return (
            <ActionRow
              key={i}
              icon={action.icon}
              title={action.title}
              subtitle={action.subtitle}
              href={action.href}
              disabled={action.disabled}
              className={action.className}
            />
          );
        }

        if (action.type === "action" && action.onClick === "cancel") {
          return (
            <ActionRow
              key={i}
              icon={action.icon}
              title={action.title}
              subtitle={action.subtitle}
              onClick={onCancel}
              disabled={cancelling || action.disabled}
              className={action.className}
            />
          );
        }

        return null;
      })}
    </div>
  );
}