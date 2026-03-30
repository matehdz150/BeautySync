"use client";

import { createContext, useContext, useState } from "react";

type GiftCardDraftState = {
  isOpen: boolean;
  amount: string;
  publicUserId: string | null;
  mode: "client" | "email";
  sendEmail: boolean;
  email: string;
};

type GiftCardDraftContextType = {
  state: GiftCardDraftState;

  open: () => void;
  close: () => void;

  setAmount: (value: string) => void;
  reset: () => void;

  setPublicUser: (id: string) => void;
  clearPublicUser: () => void;

  setMode: (mode: "client" | "email")=>void;

  setSendEmail: (value: boolean) => void;
  setEmail: (value: string) => void;
};

const GiftCardDraftContext = createContext<
  GiftCardDraftContextType | undefined
>(undefined);

export function GiftCardDraftProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<GiftCardDraftState>({
    isOpen: false,
    amount: "",
    publicUserId: null,
    sendEmail: false,
    email: "",
    mode: "client",
  });

  function open() {
    setState((s) => ({ ...s, isOpen: true }));
  }

  function close() {
    setState((s) => ({ ...s, isOpen: false }));
  }

  function setAmount(value: string) {
    setState((s) => ({ ...s, amount: value }));
  }

  function setPublicUser(id: string) {
    setState((s) => ({
      ...s,
      publicUserId: id,
      sendEmail: false,
      email: "",
    }));
  }

  function setMode(mode: "client" | "email") {
    setState((s) => ({
      ...s,
      mode,
      publicUserId: mode === "client" ? s.publicUserId : null,
      email: mode === "email" ? s.email : "",
      endEmail: false
    }));
  }

  function clearPublicUser() {
    setState((s) => ({ ...s, publicUserId: null }));
  }

  function setSendEmail(value: boolean) {
    setState((s) => ({ ...s, sendEmail: value }));
  }

  function setEmail(value: string) {
    setState((s) => ({ ...s, email: value }));
  }

  function reset() {
    setState({
      isOpen: false,
      amount: "",
      publicUserId: null,
      sendEmail: false,
      email: "",
      mode: 'client',
    });
  }

  return (
    <GiftCardDraftContext.Provider
      value={{
        state,
        open,
        close,
        setAmount,
        reset,
        setPublicUser,
        clearPublicUser,
        setEmail,
        setSendEmail,
        setMode,
      }}
    >
      {children}
    </GiftCardDraftContext.Provider>
  );
}

export function useGiftCardDraft() {
  const ctx = useContext(GiftCardDraftContext);

  if (!ctx) {
    throw new Error(
      "useGiftCardDraft must be used inside GiftCardDraftProvider",
    );
  }

  return ctx;
}
