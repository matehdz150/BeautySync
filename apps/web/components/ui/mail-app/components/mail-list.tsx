"use client";

import { ComponentProps } from "react";
import { formatDistanceToNow } from "date-fns";

import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

import { type Mail } from "../data";
import { useMail } from "../mail-context";

interface MailListProps {
  items: Mail[];
}

export function MailList({ items }: MailListProps) {
  const { selectedMail, setSelectedMail } = useMail();

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {items.map((item) => {
          const isSelected = selectedMail?.id === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setSelectedMail(item)}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all",
                "hover:bg-accent/70",
                isSelected && "bg-accent/70"
              )}
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{item.name}</div>

                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-600" />
                    )}
                  </div>

                  <div
                    className={cn(
                      "ml-auto text-xs",
                      isSelected
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatDistanceToNow(new Date(item.date), {
                      addSuffix: true,
                    })}
                  </div>
                </div>

                <div className="text-xs font-medium">{item.subject}</div>
              </div>

              <div className="line-clamp-2 text-xs text-muted-foreground">
                {item.text.substring(0, 300)}
              </div>

              {item.labels.length > 0 && (
                <div className="flex items-center gap-2">
                  {item.labels.map((label) => (
                    <Badge
                      key={label}
                      variant={getBadgeVariantFromLabel(label)}
                    >
                      {label}
                    </Badge>
                  ))}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

function getBadgeVariantFromLabel(
  label: string
): ComponentProps<typeof Badge>["variant"] {
  const normalized = label.toLowerCase();

  if (normalized === "work") {
    return "default";
  }

  if (normalized === "personal") {
    return "outline";
  }

  return "secondary";
}