import { useState } from "react";
import { Check, ChevronDown, User } from "lucide-react";
import { cn } from "@/lib/utils";

export function StaffPicker({
  value,
  staffOptions,
  onChange,
}: {
  value: string | "ANY";
  staffOptions: { id: string; name: string }[];
  onChange: (staffId: string | "ANY", staffName?: string) => void;
}) {
  const [open, setOpen] = useState(false);

  const selected =
    value === "ANY"
      ? { label: "Cualquier staff" }
      : staffOptions.find((s) => s.id === value);

  return (
    <div className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between gap-3",
          "rounded-xl border px-3 py-2 text-sm bg-white",
          "hover:border-black/30 transition"
        )}
      >
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
            <User className="h-3.5 w-3.5" />
          </div>

          <span className="truncate">
            {value === "ANY" ? "Cualquier staff" : selected?.name}
          </span>
        </div>

        <ChevronDown className="h-4 w-4 text-muted-foreground" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-20 mt-2 w-full rounded-xl border bg-white shadow-lg overflow-hidden">
          {/* ANY */}
          <Option
            selected={value === "ANY"}
            onClick={() => {
              onChange("ANY");
              setOpen(false);
            }}
          >
            Cualquier staff
          </Option>

          <div className="border-t" />

          {staffOptions.map((st) => (
            <Option
              key={st.id}
              selected={value === st.id}
              onClick={() => {
                onChange(st.id, st.name);
                setOpen(false);
              }}
            >
              {st.name}
            </Option>
          ))}
        </div>
      )}
    </div>
  );
}

function Option({
  children,
  selected,
  onClick,
}: {
  children: React.ReactNode;
  selected?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 text-sm",
        "hover:bg-black/[0.04] transition",
        selected && "bg-indigo-50 text-indigo-700"
      )}
    >
      <span>{children}</span>

      {selected && <Check className="h-4 w-4" />}
    </button>
  );
}