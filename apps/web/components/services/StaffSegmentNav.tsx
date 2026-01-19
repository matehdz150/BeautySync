"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = {
  label: string;
  href: string;
};

export function StaffSegmentNav({ items }: { items: Item[] }) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === pathname || pathname.startsWith(href + "/");
  }

  return (
    <div className="inline-flex items-center  bg-white p-1 rounded-full gap-1">
      {items.map((item) => {
        const active = isActive(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "px-4 py-1.5 rounded-full text-sm transition-all whitespace-nowrap shadow-none",
              active
                ? "bg-indigo-400 text-white font-medium shadow-sm"
                : "text-gray-700 hover:bg-gray-100"
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}