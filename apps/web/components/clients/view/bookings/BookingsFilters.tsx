"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import FilterButton from "../ui/FilterButton";

export default function BookingsFilters({
  statusFilter,
  setStatusFilter,
}: any) {
  const [openDropdown, setOpenDropdown] = useState(false);

  return (
    <div className="flex gap-2 mb-6 flex-wrap items-center justify-between bg-gray-50 py-4 px-3">
      <div className="flex gap-2">
        <FilterButton
          label="Todas"
          active={statusFilter === "ALL"}
          onClick={() => setStatusFilter("ALL")}
        />

        <FilterButton
          label="Completadas"
          active={statusFilter === "COMPLETED"}
          onClick={() => setStatusFilter("COMPLETED")}
        />
      </div>

      <div className="relative">
        <Button
          variant="primary"
          onClick={() =>
            setOpenDropdown((prev) => !prev)
          }
          className="px-5 py-5 rounded-full text-sm"
        >
          Mas <ChevronDown />
        </Button>

        {openDropdown && (
          <div className="absolute mt-2 w-44 bg-white border rounded-lg shadow-lg z-20">
            {["CONFIRMED", "CANCELLED", "PAYED"].map(
              (status) => (
                <button
                  key={status}
                  onClick={() => {
                    setStatusFilter(status);
                    setOpenDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm hover:bg-muted"
                >
                  {status}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}