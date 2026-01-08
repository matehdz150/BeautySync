import { cn } from "@/lib/utils";

export function TimeColumn({ timeSlots }: { timeSlots: string[] }) {
  return (
    <div className="w-14">
      {timeSlots.map((t) => {
        const isFullHour = t.endsWith(":00");

        return (
          <div
            key={t}
            className={cn(
              "h-5 flex items-start justify-end pr-2 text-xs",
              isFullHour ? "text-black font-medium" : "text-transparent"
            )}
          >
            {isFullHour ? t : ""}
          </div>
        );
      })}
    </div>
  );
}