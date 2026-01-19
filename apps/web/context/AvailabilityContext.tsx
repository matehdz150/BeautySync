"use client";

import {
  createContext,
  useContext,
  useCallback,
  useState,
  ReactNode,
} from "react";

import { usePublicBooking } from "@/context/PublicBookingContext";
import {
  getAvailabilityChain,
  type AvailabilityChainPlan,
  type AvailabilityChainRequest,
} from "@/lib/services/public/availability";

/* =====================
   TYPES
===================== */

type AvailabilityContextType = {
  validStartTimes: string[];
  plans: AvailabilityChainPlan[];
  selectedPlan: AvailabilityChainPlan | null;
  loading: boolean;

  fetchAvailableTimesForDate: (date: string) => Promise<void>;
  selectPlanByStartIso: (startIso: string) => void;
  clearSelection: () => void;
};

const AvailabilityContext = createContext<AvailabilityContextType | null>(null);

/* =====================
   PROVIDER
===================== */

export function AvailabilityProvider({ children }: { children: ReactNode }) {
  const booking = usePublicBooking();

  const [validStartTimes, setValidStartTimes] = useState<string[]>([]);
  const [plans, setPlans] = useState<AvailabilityChainPlan[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] =
    useState<AvailabilityChainPlan | null>(null);

  const selectPlanByStartIso = useCallback(
    (startIso: string) => {
      const plan = plans.find((p) => p.startIso === startIso) ?? null;
      setSelectedPlan(plan);
    },
    [plans]
  );

  const clearSelection = useCallback(() => {
    setSelectedPlan(null);
  }, []);

  const fetchAvailableTimesForDate = useCallback(
    async (date: string) => {
      if (!booking.branch) return;
      if (!booking.services.length) return;

      setLoading(true);

      try {
        // 🔥 Orden estable (primero más largo)
        const orderedServices = [...booking.services].sort((a, b) => {
          const da = booking.catalog.find((s) => s.id === a)?.durationMin ?? 0;
          const db = booking.catalog.find((s) => s.id === b)?.durationMin ?? 0;
          return db - da;
        });

        const chain: AvailabilityChainRequest["chain"] = orderedServices.map(
          (serviceId) => {
            const staffId = booking.staffByService[serviceId];

            if (!staffId) {
              throw new Error(`Missing staffId for serviceId=${serviceId}`);
            }

            return { serviceId, staffId };
          }
        );

        const body: AvailabilityChainRequest = { date, chain };

        console.log("CHAIN BODY FRONT:", JSON.stringify(body, null, 2));

        const resultPlans = await getAvailabilityChain({
          slug: booking.branch.slug,
          body,
        });

        setPlans(resultPlans);
        setValidStartTimes(resultPlans.map((p) => p.startIso));
        setSelectedPlan(null);
      } catch (err) {
        console.error(err);
        setPlans([]);
        setValidStartTimes([]);
      } finally {
        setLoading(false);
      }
    },
    [booking.branch, booking.services, booking.catalog, booking.staffByService]
  );

  return (
    <AvailabilityContext.Provider
      value={{
        validStartTimes,
        plans,
        selectedPlan,
        loading,
        fetchAvailableTimesForDate,
        selectPlanByStartIso,
        clearSelection,
      }}
    >
      {children}
    </AvailabilityContext.Provider>
  );
}

/* =====================
   HOOK
===================== */

export function useAvailability() {
  const ctx = useContext(AvailabilityContext);
  if (!ctx) {
    throw new Error("useAvailability must be used inside AvailabilityProvider");
  }
  return ctx;
}
