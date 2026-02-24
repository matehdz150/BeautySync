"use client";

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { BookingAction } from "./booking-types";

type IconType = React.ComponentType<{
  className?: string;
  width?: number;
  height?: number;
}>;

type Props = {
  icon: IconType;
  title: string;
  subtitle: string;
  items: BookingAction[];
  disabled?: boolean;
  className?: string;
  onCancel: () => void;
};

export function DropdownActionRow({
  icon: TriggerIcon,
  title,
  subtitle,
  items,
  disabled,
  className,
  onCancel,
}: Props) {
  return (
    <DropdownMenu>
      {/* 🔽 Trigger */}
      <DropdownMenuTrigger asChild>
        <button
          disabled={disabled}
          className={cn(
            "flex items-center gap-4 rounded-2xl px-2 py-3 w-full text-left transition hover:bg-black/[0.03]",
            disabled && "opacity-50 pointer-events-none",
            className
          )}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
            <TriggerIcon width={20} height={20} />
          </div>

          <div className="flex-1">
            <p className="font-semibold">{title}</p>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        </button>
      </DropdownMenuTrigger>

      {/* 🔽 Content */}
      <DropdownMenuContent align="start" className="w-[340px]">
        {items.map((item, i) => {
          if (item.type === "link") {
            const Icon = item.icon as IconType;

            return (
              <DropdownMenuItem key={i} asChild>
                <Link
                  href={item.href}
                  className="flex items-start gap-3 w-full py-3"
                >
                  <span className="h-12 w-12 flex items-center justify-center bg-indigo-100 rounded-full shrink-0">
                    <Icon width={44} height={44} className="text-indigo-700" />
                  </span>

                  <div className="flex flex-col">
                    <span className="text-sm font-medium leading-tight">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="text-xs text-muted-foreground leading-tight">
                        {item.subtitle}
                      </span>
                    )}
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          }

          if (item.type === "action" && item.onClick === "cancel") {
            const Icon = item.icon as IconType;

            return (
              <DropdownMenuItem
                key={i}
                onClick={onCancel}
                className="flex items-start gap-3 py-3"
              >
                <span className="h-12 w-12 flex items-center justify-center bg-red-50 rounded-full shrink-0">
                  <Icon width={24} height={24} className="text-red-600" />
                </span>

                <div className="flex flex-col">
                  <span className="text-sm font-medium text-red-600">
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span className="text-xs text-muted-foreground">
                      {item.subtitle}
                    </span>
                  )}
                </div>
              </DropdownMenuItem>
            );
          }

          return null;
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}