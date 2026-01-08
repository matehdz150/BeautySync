"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/context/AuthContext";

function getInitials(emailOrName?: string) {
  if (!emailOrName) return "U";
  return emailOrName.charAt(0).toUpperCase();
}

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout, loading } = useAuth();   // ⬅️ si no tienes loading, lo quitamos

  const displayName = user?.email;
  const role = user?.role ?? "—";

  const isLoading = loading || !user;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        
        {isLoading ? (
          // 🔥 SKELETON VIEW
          <div className="flex items-center gap-3">
            <Skeleton className="w-9 h-9 rounded-full" />

            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-3 w-20" />
            </div>

            <Skeleton className="h-4 w-4 rounded-sm" />
          </div>
        ) : (
          // 🔥 REAL VIEW
          <button className="flex items-center gap-3 hover:opacity-90 transition">
            
            <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center text-sm">
              {getInitials(displayName)}
            </div>

            <div className="flex flex-col leading-tight text-left">
              <span className="font-normal text-sm">
                {displayName}
              </span>

              <span className="text-xs text-muted-foreground capitalize">
                {role}
              </span>
            </div>

            <ChevronDown className="w-4 h-4 opacity-60" />
          </button>
        )}

      </PopoverTrigger>

      {!isLoading && (
        <PopoverContent
          align="end"
          className="
            w-56 rounded-2xl  bg-white shadow-none
            px-2 py-2 space-y-3
          "
        >
          <MenuButton text="My Profile" onClick={() => {}} className=" hover:bg-indigo-500 hover:text-white" />
          <MenuButton text="Account Settings" onClick={() => {}} className="hover:bg-indigo-500 hover:text-white"/>
          <MenuButton text="Billing" onClick={() => {}} className="hover:bg-indigo-500 hover:text-white" />
          <MenuButton
            text="Log Out"
            className="hover:bg-indigo-500 hover:text-white"
            onClick={logout}
          />
        </PopoverContent>
      )}
    </Popover>
  );
}

function MenuButton({
  text,
  className,
  onClick,
}: {
  text: string;
  className?: string;
  onClick: () => void;
}) {
  return (
    <button
      className={`
        w-full text-left px-3 py-2 rounded-none
        text-sm transition
        hover:bg-accent
        ${className ?? ""}
      `}
      onClick={onClick}
    >
      {text}
    </button>
  );
}