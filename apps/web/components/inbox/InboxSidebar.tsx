"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  Inbox,
  MessageSquare,
  Calendar,
  Star,
  Archive,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  collapsed?: boolean;
};

type Item = {
  label: string;
  href: string;
  icon: React.ReactNode;
  count?: number;
};

const mainItems: Item[] = [
  {
    label: "Inbox",
    href: "/dashboard/inbox/main",
    icon: <Inbox className="h-4 w-4" />,
    count: 128,
  },
  {
    label: "Mensajes",
    href: "/dashboard/inbox/messages",
    icon: <MessageSquare className="h-4 w-4" />,
  },
  {
    label: "Citas",
    href: "/dashboard/inbox/appointments",
    icon: <Calendar className="h-4 w-4" />,
  },
  {
    label: "Reseñas",
    href: "/dashboard/inbox/reviews",
    icon: <Star className="h-4 w-4" />,
  },
];

const secondaryItems: Item[] = [
  {
    label: "Urgentes",
    href: "/dashboard/inbox/urgent",
    icon: <AlertCircle className="h-4 w-4" />,
  },
  {
    label: "Archivados",
    href: "/dashboard/inbox/archived",
    icon: <Archive className="h-4 w-4" />,
  },
  {
    label: "Papelera",
    href: "/dashboard/inbox/trash",
    icon: <Trash2 className="h-4 w-4" />,
  },
];

export default function InboxSidebar({ collapsed }: Props) {
  const pathname = usePathname();
  const router = useRouter();

  function isActive(href: string) {
    if (!pathname) return false;

    return pathname === href || pathname.startsWith(href + "/");
  }

  function renderItem(item: Item) {
    const active = isActive(item.href);

    return (
      <button
        key={item.href}
        onClick={() => router.push(item.href)}
        className={cn(
          "flex w-full items-center rounded-xl py-2 text-sm transition-colors",
          collapsed ? "justify-center px-2" : "gap-3 px-3",
          active
            ? "bg-black text-white"
            : "text-muted-foreground hover:bg-muted/50 hover:text-black"
        )}
      >
        {/* ICON CONTAINER (FIXED SIZE) */}
        <div className="flex h-5 w-5 items-center justify-center shrink-0">
          {item.icon}
        </div>

        {!collapsed && (
          <>
            <span className="flex-1 text-left font-medium">{item.label}</span>

            {typeof item.count === "number" && (
              <span
                className={cn(
                  "text-xs font-medium",
                  active ? "text-white/80" : "text-muted-foreground"
                )}
              >
                {item.count}
              </span>
            )}
          </>
        )}
      </button>
    );
  }

  return (
    <aside
      className={cn(
        "flex h-full flex-col gap-6 border-r bg-background py-4",
        collapsed ? "px-2" : "px-3"
      )}
    >
      <div className="flex flex-col gap-1">{mainItems.map(renderItem)}</div>

      {!collapsed && <div className="h-px bg-border" />}

      <div className="flex flex-col gap-1">
        {secondaryItems.map(renderItem)}
      </div>
    </aside>
  );
}
