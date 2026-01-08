"use client";

import { createContext, useContext, useState } from "react";

//
// TYPES
//
export type Service = {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  category?: { id: string; name: string; colorHex: string } | null;
};

export type SelectedService = {
  service: Service;
  staffId?: string;
  startISO?: string;
};

export type Client = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
};


type Ctx = {
  services: SelectedService[];
  client?: Client;

  addService: (s: Service) => void;
  updateStaff: (serviceId: string, staffId: string, staffName: string) => void;
  updateStartISO: (serviceId: string, iso: string) => void;
  removeService: (serviceId: string) => void;

  setClient: (c?: Client) => void;
  clear: () => void;
};

//
// CONTEXT
//
const CtxObj = createContext<Ctx | null>(null);

//
// PROVIDER
//
export function AppointmentBuilderProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [services, setServices] = useState<SelectedService[]>([]);
  const [client, setClient] = useState<Client | undefined>();

  function addService(service: Service) {
    setServices(prev => [...prev, { service }]);
  }

  function updateStaff(serviceId: string, staffId: string, staffName: string) {
  setServices(prev =>
    prev.map(s =>
      s.service.id === serviceId
        ? { ...s, staffId, staffName }
        : s
    )
  );
}

  function updateStartISO(serviceId: string, iso: string) {
    setServices(prev =>
      prev.map(s =>
        s.service.id === serviceId ? { ...s, startISO: iso } : s
      )
    );
  }

  function removeService(serviceId: string) {
    setServices(prev => prev.filter(s => s.service.id !== serviceId));
  }

  function clear() {
    setServices([]);
    setClient(undefined);   // 👈 limpias cliente también
  }

  return (
    <CtxObj.Provider
      value={{
        services,
        client,
        addService,
        updateStaff,
        updateStartISO,
        removeService,
        setClient,
        clear,
      }}
    >
      {children}
    </CtxObj.Provider>
  );
}

//
// HOOK
//
export function useAppointmentBuilder() {
  const ctx = useContext(CtxObj);
  if (!ctx)
    throw new Error(
      "useAppointmentBuilder must be used inside AppointmentBuilderProvider"
    );
  return ctx;
}