"use client";

import { Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/context/NotificationsContext";
import { useEffect, useRef } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

export function BellButton() {
  const router = useRouter();
  const { unreadCount } = useNotifications();

  const bellControls = useAnimation();
  const prevCount = useRef(unreadCount);

  // 🔴 ahora máximo visible 50+
  const displayCount = unreadCount > 49 ? "50+" : String(unreadCount);

  // 🔔 detectar nuevas notificaciones
  useEffect(() => {
    const increased = unreadCount > prevCount.current;

    if (increased) {
      // shake campana
      bellControls.start({
        rotate: [0, 18, -16, 12, -8, 5, -2, 0],
        transition: { duration: 0.7, ease: "easeOut" },
      });

      // vibración móvil solo hasta 49 (evita spam)
      if (
        typeof window !== "undefined" &&
        navigator.vibrate &&
        unreadCount <= 49
      ) {
        navigator.vibrate(12);
      }
    }

    prevCount.current = unreadCount;
  }, [unreadCount, bellControls]);

  const handleClick = () => {
    router.push("/dashboard/inbox/main");
  };

  return (
    <button
      onClick={handleClick}
      className="
        relative
        h-9 w-9
        flex items-center justify-center
        rounded-full
        transition
        hover:bg-muted/60
      "
    >
      {/* 🔔 Bell */}
      <motion.div animate={bellControls}>
        <Bell size={18} />
      </motion.div>

      {/* 🔴 Badge */}
      <AnimatePresence mode="popLayout">
        {unreadCount > 0 && (
          <motion.span
            key="badge"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 25 }}
            className="
              absolute
              -top-1
              -right-1
              min-w-[18px]
              h-[18px]
              px-1
              rounded-full
              bg-black
              text-white
              text-[11px]
              font-semibold
              flex items-center justify-center
              overflow-hidden
            "
          >
            <AnimatePresence mode="wait">
              <motion.span
                key={displayCount}
                initial={{ y: 12, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -12, opacity: 0 }}
                transition={{ duration: 0.18 }}
              >
                {displayCount}
              </motion.span>
            </AnimatePresence>
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}