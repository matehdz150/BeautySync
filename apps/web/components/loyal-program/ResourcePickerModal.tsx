"use client";

import { useEffect, useState } from "react";
import { getServicesByBranch, Service } from "@/lib/services/services";
import { Button } from "@/components/ui/button";

type Props = {
  branchId: string;
  type: "SERVICE"; // luego agregamos PRODUCT
  open: boolean;
  onClose: () => void;
  onSelect: (item: Service) => void;
};

export function ResourcePickerModal({
  branchId,
  type,
  open,
  onClose,
  onSelect,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<Service[]>([]);

  useEffect(() => {
    if (!open || !branchId) return;

    const load = async () => {
      try {
        setLoading(true);

        if (type === "SERVICE") {
          const services = await getServicesByBranch(branchId);
          setItems(services.filter((s) => s.isActive));
        }
      } catch (err) {
        console.error(err);
        alert("Error cargando recursos");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [open, branchId, type]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-xl rounded-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">
          Seleccionar {type === "SERVICE" ? "servicio" : "recurso"}
        </h2>

        {loading ? (
          <p className="text-sm text-gray-500">Cargando...</p>
        ) : (
          <div className="max-h-80 overflow-y-auto space-y-2">
            {items.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onSelect(item);
                  onClose();
                }}
                className="w-full text-left border rounded-xl p-4 hover:bg-gray-50 transition"
              >
                <p className="font-medium">{item.name}</p>

                <p className="text-xs text-gray-500">
                  {item.durationMin} min • $
                  {(item.priceCents ?? 0) / 100}
                </p>
              </button>
            ))}
          </div>
        )}

        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Cerrar
          </Button>
        </div>
      </div>
    </div>
  );
}