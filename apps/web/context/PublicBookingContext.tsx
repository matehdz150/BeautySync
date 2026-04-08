"use client";

import { AvailabilityChainPlan } from "@/lib/services/public/availability";
import { createContext, useContext, useReducer, ReactNode } from "react";

/* =====================
   TYPES
===================== */

type AssignmentMode = "ANY" | "BY_SERVICE";

export type BranchRatingReview = {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string | null; // ISO
};

export type BranchRating = {
  average: number | null;
  count: number;
  reviews: BranchRatingReview[];
};

export type Branch = {
  id: string;
  name: string;
  slug: string;
  address: string;
  images?: any[];
  services?: any[];
  lat?: string;
  lng?: string;
  description?: string;
  rating?: BranchRating;
};

export type PublicService = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number | null;
  category: {
    id: string;
    name: string;
    icon: string;
    hexColor: string;
  };
};

type BookingState = {
  branch: Branch | null;
  step: number;

  services: string[]; // ids de servicios seleccionados
  staffByService: Record<string, string>;
  assignmentMode: AssignmentMode;

  date: string | null;
  time: string | null;

  loading: boolean;
  error: string | null;

  catalog: PublicService[];

  canContinue: boolean;

  staffCatalog: { id: string; name: string; avatarUrl?: string }[];

  selectedPlan: AvailabilityChainPlan | null;
  appointmentsDraft: {
    serviceId: string;
    staffId: string;
    startIso: string;
    endIso: string;
    durationMin: number;
    priceCents: number;
  }[];

  benefits: {
    isAuthenticated: boolean;
    hasActiveProgram: boolean;
    giftCards: {
      id: string;
      code: string;
      balanceCents: number;
      expiresAt?: string | null;
    }[];
  coupons: {
    id: string;
    code: string;
    type: "percentage" | "fixed";
    value: number;
    expiresAt?: string | null;
  }[];

  pointsBalance: number;

  redeemableRewards: {
    availableCount: number;
    rewards: {
      id: string;
      name: string;
      pointsCost: number;
      type: "SERVICE" | "PRODUCT" | "COUPON" | "GIFT_CARD" | "CUSTOM";
      referenceId?: string | null;
      config?: Record<string, unknown>;
    }[];
  };

  validatedCoupon: {
    id: string;
    discountCents: number;
    code: string;
  } | null;

  benefitsLoading: boolean;
  selectedCouponId: string | null;
  appliedCouponCode: string | null;
  appliedCouponDiscountCents: number;
  selectedGiftCardId: string | null;
  giftCardAmountCents: number;
};

type BookingAction =
  | { type: "START_LOADING" }
  | { type: "SET_BRANCH"; payload: Branch }
  | { type: "SET_ERROR"; payload: string }
  | { type: "NEXT_STEP" }
  | { type: "PREV_STEP" }
  | { type: "SET_STEP"; payload: number }
  | { type: "TOGGLE_SERVICE"; payload: string }
  | {
      type: "SET_STAFF_FOR_SERVICE";
      payload: { serviceId: string; staffId: string };
    }
  | { type: "SET_DATE"; payload: string }
  | { type: "SET_TIME"; payload: string }
  | { type: "SET_CATALOG"; payload: PublicService[] }
  | { type: "SET_ASSIGNMENT_MODE"; payload: AssignmentMode }
  | { type: "SET_TIME"; payload: string }
  | { type: "SET_SELECTED_PLAN"; payload: AvailabilityChainPlan | null }
  | {
      type: "SET_APPOINTMENTS_DRAFT";
      payload: BookingState["appointmentsDraft"];
    }
  | {
      type: "SET_STAFF_CATALOG";
      payload: { id: string; name: string; avatarUrl?: string }[];
    }
  | {
      type: "SET_VALIDATED_COUPON";
      payload: {
        id: string;
        code: string;
        discountCents: number;
      } | null;
    }
  | { type: "SET_BENEFITS"; payload: BookingState["benefits"] }
  | { type: "SELECT_GIFT_CARD"; payload: { id: string; amount: number } }
  | { type: "SET_GIFT_CARD_AMOUNT"; payload: number }
  | { type: "SELECT_COUPON"; payload: string | null }
  | {
      type: "SET_APPLIED_COUPON";
      payload: { code: string; discountCents: number } | null;
    }
  | { type: "SET_BENEFITS_LOADING"; payload: boolean }
  | { type: "RESET_BOOKING" };

/* =====================
   INITIAL STATE
===================== */

const initialState: BookingState = {
  branch: null,
  step: 1,

  services: [],
  staffByService: {},
  assignmentMode: "ANY",

  date: null,
  time: null,

  loading: false,
  error: null,

  catalog: [],
  staffCatalog: [],

  canContinue: false,
  selectedPlan: null,
  appointmentsDraft: [],

  benefits: {
    isAuthenticated: false,
    hasActiveProgram: false,
    giftCards: [],
    coupons: [],
    pointsBalance: 0,
    redeemableRewards: { availableCount: 0, rewards: [] },
    tier: null,
    tierRewards: [],
  },
  validatedCoupon: {
    id: "",
    code: "",
    discountCents: 0,
  },
  benefitsLoading: false,
  selectedCouponId: null,
  appliedCouponCode: null,
  appliedCouponDiscountCents: 0,
  selectedGiftCardId: null,
  giftCardAmountCents: 0,
};

/* =====================
   REDUCER
===================== */

function computeCanContinue(state: BookingState): boolean {
  switch (state.step) {
    case 1:
      // Servicios seleccionados
      return state.services.length > 0;

    case 2:
      if (state.assignmentMode === "ANY") return true;

      if (state.assignmentMode === "BY_SERVICE")
        return state.services.every(
          (id) => !!state.staffByService[id], // "ANY" o staffId
        );

      return false;

    case 3:
      return (
        !!state.date &&
        !!state.selectedPlan &&
        state.appointmentsDraft.length > 0
      );

    case 4:
      return true;

    default:
      return false;
  }
}

function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  let nextState: BookingState;

  switch (action.type) {
    case "START_LOADING":
      nextState = {
        ...state,
        loading: true,
        error: null,
      };
      break;

    case "SET_BRANCH":
      nextState = {
        ...state,
        branch: action.payload,
        loading: false,
        error: null,
      };
      break;

    case "SET_ERROR":
      nextState = {
        ...state,
        error: action.payload,
        loading: false,
      };
      break;

    case "SET_STEP":
      nextState = {
        ...state,
        step: action.payload,
      };
      break;

    case "NEXT_STEP":
      nextState = {
        ...state,
        step: Math.min(state.step + 1, 4),
      };
      break;

    case "PREV_STEP":
      nextState = {
        ...state,
        step: Math.max(state.step - 1, 1),
      };
      break;

    case "TOGGLE_SERVICE": {
      const exists = state.services.includes(action.payload);

      if (exists) {
        const { [action.payload]: _, ...restStaff } = state.staffByService;

        nextState = {
          ...state,
          services: state.services.filter((id) => id !== action.payload),
          staffByService: restStaff,
        };
      } else {
        nextState = {
          ...state,
          services: [...state.services, action.payload],
        };
      }
      break;
    }

    case "SET_STAFF_FOR_SERVICE":
      nextState = {
        ...state,
        staffByService: {
          ...state.staffByService,
          [action.payload.serviceId]: action.payload.staffId,
        },
      };
      break;

    case "SET_DATE":
      nextState = {
        ...state,
        date: action.payload,
        time: null,
        selectedPlan: null,
        appointmentsDraft: [],
      };
      break;

    case "SET_TIME":
      nextState = {
        ...state,
        time: action.payload,
      };
      break;

    case "SET_CATALOG":
      nextState = {
        ...state,
        catalog: action.payload,
        loading: false,
        error: null,
      };
      break;

    case "SET_ASSIGNMENT_MODE":
      nextState = {
        ...state,
        assignmentMode: action.payload,
        staffByService: {}, // 👈 resetea si cambian de modo
      };
      break;

    case "RESET_BOOKING":
      nextState = initialState;
      break;

    case "SET_SELECTED_PLAN":
      nextState = { ...state, selectedPlan: action.payload };
      break;

    case "SET_APPOINTMENTS_DRAFT":
      nextState = { ...state, appointmentsDraft: action.payload };
      break;

    case "SET_STAFF_CATALOG":
      nextState = {
        ...state,
        staffCatalog: action.payload,
      };
      break;

    case "SET_BENEFITS":
      nextState = {
        ...state,
        benefits: action.payload,
      };
      break;

    case "SET_BENEFITS_LOADING":
      nextState = {
        ...state,
        benefitsLoading: action.payload,
      };
      break;

    case "SELECT_GIFT_CARD":
      nextState = {
        ...state,
        selectedGiftCardId: action.payload.id,
        selectedCouponId: null,
        appliedCouponCode: null,
        appliedCouponDiscountCents: 0,
      };
      break;

    case "SET_GIFT_CARD_AMOUNT":
      nextState = {
        ...state,
        giftCardAmountCents: action.payload,
      };
      break;

    case "SET_VALIDATED_COUPON":
      nextState = {
        ...state,
        validatedCoupon: action.payload,
        selectedCouponId: action.payload?.id ?? null,
        selectedGiftCardId: null,
        giftCardAmountCents: 0,
      };
      break;

    case "SELECT_COUPON":
      nextState = {
        ...state,
        selectedCouponId: action.payload,
        selectedGiftCardId: null,
        giftCardAmountCents: 0,
      };
      break;

    case "SET_APPLIED_COUPON":
      nextState = {
        ...state,
        appliedCouponCode: action.payload?.code ?? null,
        appliedCouponDiscountCents: action.payload?.discountCents ?? 0,
      };
      break;

    default:
      nextState = state;
  }

  // ✅ AQUÍ se recalcula SIEMPRE
  return {
    ...nextState,
    canContinue: computeCanContinue(nextState),
  };
}

/* =====================
   CONTEXT
===================== */

type BookingContextType = BookingState & {
  dispatch: React.Dispatch<BookingAction>;
};

const PublicBookingContext = createContext<BookingContextType | null>(null);

/* =====================
   PROVIDER
===================== */

export function PublicBookingProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(bookingReducer, initialState);

  return (
    <PublicBookingContext.Provider
      value={{
        ...state,
        dispatch,
      }}
    >
      {children}
    </PublicBookingContext.Provider>
  );
}

/* =====================
   HOOK
===================== */

export function usePublicBooking() {
  const ctx = useContext(PublicBookingContext);

  if (!ctx) {
    throw new Error(
      "usePublicBooking must be used inside PublicBookingProvider",
    );
  }

  return ctx;
}
