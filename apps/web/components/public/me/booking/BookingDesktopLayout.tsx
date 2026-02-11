"use client";

import { useMemo } from "react";
import { usePathname } from "next/navigation";

type Props = {
  list: React.ReactNode;
  detail: React.ReactNode;
  side: React.ReactNode;
};

type SideType = "rate" | "reschedule" | null;

export function BookingDesktopLayout({ list, detail, side }: Props) {
  const pathname = usePathname();

  const mode = useMemo<"list" | "detail" | "side">(() => {
    if (/\/me\/bookings\/[^/]+\/(rate|reschedule)$/.test(pathname))
      return "side";

    if (/\/me\/bookings\/[^/]+$/.test(pathname))
      return "detail";

    return "list";
  }, [pathname]);

  const sideType = useMemo<SideType>(() => {
    if (/\/rate$/.test(pathname)) return "rate";
    if (/\/reschedule$/.test(pathname)) return "reschedule";
    return null;
  }, [pathname]);

  return (
    <>
      <style jsx global>{`
        .booking-grid {
          display: grid;
          gap: 24px;
          transition: grid-template-columns 420ms cubic-bezier(0.22, 1, 0.36, 1);
        }

        /* ===== GRID MODES ===== */

        .booking-grid[data-mode="list"] {
          grid-template-columns: 1fr;
        }

        .booking-grid[data-mode="detail"] {
          grid-template-columns: 520px 1fr;
        }

        .booking-grid[data-mode="side"][data-side="rate"] {
          grid-template-columns: 1fr 460px;
        }

        .booking-grid[data-mode="side"][data-side="reschedule"] {
          grid-template-columns: 1fr 480px;
        }

        /* ===== PANEL ANIMATIONS ===== */

        .panel {
          height: 100%;
          border-radius: 28px;
          border: 1px solid rgba(0, 0, 0, 0.05);
          background: white;
          transition:
            opacity 260ms ease-out,
            transform 260ms ease-out;
          will-change: opacity, transform;
        }

        /* DETAIL PANEL */
        .panel-detail {
          opacity: 0;
          transform: translateX(8px);
        }

        .booking-grid[data-mode="detail"] .panel-detail,
        .booking-grid[data-mode="side"] .panel-detail {
          opacity: 1;
          transform: translateX(0);
        }

        /* SIDE PANEL */
        .panel-side {
          opacity: 0;
          transform: translateX(16px);
        }

        .booking-grid[data-mode="side"] .panel-side {
          opacity: 1;
          transform: translateX(0);
        }
      `}</style>

      <div className="w-full">
        <div
          className="booking-grid"
          data-mode={mode}
          data-side={sideType ?? undefined}
        >
          {/* LIST */}
          {(mode === "list" || mode === "detail") && (
            <aside className="min-w-0">{list}</aside>
          )}

          {/* DETAIL */}
          {(mode === "detail" || mode === "side") && (
            <main className="min-w-0 overflow-hidden rounded-2xl">
              <div className="panel panel-detail">
                {detail}
              </div>
            </main>
          )}

          {/* SIDE (rate / reschedule) */}
          {mode === "side" && (
            <aside className="min-w-0 overflow-hidden">
              <div className="panel panel-side">
                {side}
              </div>
            </aside>
          )}
        </div>
      </div>
    </>
  );
}