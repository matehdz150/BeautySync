"use client";

import { cn } from "@/lib/utils";

export function ClientListItem({
  selected,
  name,
  email,
  onClick,
}: {
  selected?: boolean;
  name: string;
  email?: string;
  onClick?: () => void;
}) {
  return (
    <button
      className={cn(
        "flex items-center gap-3 p-3 rounded-xl w-full transition",
        selected
          ? "bg-indigo-100 border border-indigo-300"
          : "hover:bg-muted"
      )}
      onClick={onClick}
    >
      <div className="h-10 w-10 rounded-full bg-indigo-200 text-indigo-800 flex items-center justify-center font-semibold">
        {name[0].toUpperCase()}
      </div>

      <div className="text-left">
        <p className="font-medium">{name}</p>
        {email && (
          <p className="text-sm text-muted-foreground">{email}</p>
        )}
      </div>
    </button>
  );
}