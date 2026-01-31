"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import {
  Alert,
  AlertTitle,
  AlertDescription,
} from "@/components/ui/alert";
import {
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

/* ============================
   Types
============================ */

type AlertType = "info" | "success" | "warning" | "error";

type UIAlert = {
  id: string;
  type: AlertType;
  title: string;
  description?: string;
  autoCloseMs?: number;
};

type UIAlertsContextType = {
  showAlert: (alert: Omit<UIAlert, "id">) => void;
  clearAlert: (id: string) => void;
};

/* ============================
   Context
============================ */

const UIAlertsContext = createContext<UIAlertsContextType | null>(null);

/* ============================
   Provider
============================ */

export function UIAlertsProvider({ children }: { children: ReactNode }) {
  const [alerts, setAlerts] = useState<UIAlert[]>([]);

  const clearAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const showAlert = useCallback(
    (alert: Omit<UIAlert, "id">) => {
      const id = crypto.randomUUID();
      setAlerts((prev) => [...prev, { ...alert, id }]);

      if (alert.autoCloseMs) {
        setTimeout(() => clearAlert(id), alert.autoCloseMs);
      }
    },
    [clearAlert]
  );

  return (
    <UIAlertsContext.Provider value={{ showAlert, clearAlert }}>
  {children}

  {/* 🔔 TOAST STACK */}
  <div className="fixed bottom-4 right-4 z-[9999] w-[380px] pointer-events-none">
    <AnimatePresence mode="popLayout">
      {alerts.map((a) => (
        <motion.div
          key={a.id}
          layout
          initial={{
            opacity: 0,
            y: 20,
            scale: 0.96,
          }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
          }}
          exit={{
            opacity: 0,
            y: 10,
            scale: 0.95,
          }}
          transition={{
            type: "spring",
            stiffness: 420,
            damping: 30,
          }}
          className="mb-3 pointer-events-auto"
        >
          <Alert
            className="
              flex items-start gap-3
              rounded-xl
              border border-white/10
              bg-black/80
              text-white
              backdrop-blur-md
              shadow-2xl
              px-4 py-3
            "
          >
            {/* ICON */}
            <div className="mt-0.5 shrink-0">
              {iconByType[a.type]}
            </div>

            {/* CONTENT */}
            <div className="flex-1">
              <AlertTitle className="text-sm font-semibold">
                {a.title}
              </AlertTitle>

              {a.description && (
                <AlertDescription className="text-sm text-white/70">
                  {a.description}
                </AlertDescription>
              )}
            </div>
          </Alert>
        </motion.div>
      ))}
    </AnimatePresence>
  </div>
</UIAlertsContext.Provider>
  );
}

/* ============================
   Hook
============================ */

export function useUIAlerts() {
  const ctx = useContext(UIAlertsContext);
  if (!ctx) {
    throw new Error("useUIAlerts must be used inside UIAlertsProvider");
  }
  return ctx;
}

/* ============================
   Icons
============================ */

const iconByType = {
  info: (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20">
      <Info className="h-4 w-4 text-white" />
    </div>
  ),
  success: (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20">
      <CheckCircle className="h-4 w-4 text-white" />
    </div>
  ),
  warning: (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20">
      <AlertTriangle className="h-4 w-4 text-white" />
    </div>
  ),
  error: (
    <div className="flex h-6 w-6 items-center justify-center rounded-full border border-white/20">
      <XCircle className="h-4 w-4 text-white" />
    </div>
  ),
};