"use client";

import { Button } from "@/components/ui/button";
import { Mail, Phone, Plus, User, MoreHorizontal, X } from "lucide-react";

type Props = {
  client: {
    name?: string;
    email?: string;
    phone?: string;
    avatarUrl?: string;
  };
  onClear?: () => void;
};

export function SelectedClientCard({ client, onClear }: Props) {
  const { name, email, phone, avatarUrl } = client;

  return (
    <div className="w-full bg-white px-5 py-3 flex items-center justify-between">

      {/* LEFT — Avatar + Info */}
      <div className="flex items-center gap-4">

        {/* Avatar */}
        {avatarUrl ? (
          <img
            src={avatarUrl}
            className="h-12 w-12 rounded-full object-cover"
          />
        ) : (
          <div className="h-12 w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
            <User className="h-6 w-6" />
          </div>
        )}

        {/* TEXT */}
        <div className="flex flex-col">

          <span className="font-semibold text-[15px]">
            {name || "Cliente sin nombre"}
          </span>

          <div className="flex items-center gap-3 text-[13px] text-muted-foreground">

            {email && (
              <span className="flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" />
                {email}
              </span>
            )}

            {email && phone && <span>•</span>}

            {phone && (
              <span className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" />
                {phone}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT — Action buttons */}
      <div className="flex items-center gap-2">
        <Button variant={'outline'} className="shadow-none rounded-2xl" onClick={onClear}>
          Deseleccionar
          <X/>
        </Button>
      </div>
    </div>
  );
}