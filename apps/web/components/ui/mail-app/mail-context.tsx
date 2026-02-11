// components/inbox/mail-context.tsx
"use client";

import { createContext, useContext, useState } from "react";
import { Mail } from "./data";

type MailContextType = {
  selectedMail: Mail | null;
  setSelectedMail: (mail: Mail | null) => void;
};

const MailContext = createContext<MailContextType | null>(null);

export function MailProvider({ children }: { children: React.ReactNode }) {
  const [selectedMail, setSelectedMail] = useState<Mail | null>(null);

  return (
    <MailContext.Provider value={{ selectedMail, setSelectedMail }}>
      {children}
    </MailContext.Provider>
  );
}

export function useMail() {
  const context = useContext(MailContext);
  if (!context) {
    throw new Error("useMail must be used within MailProvider");
  }
  return context;
}