"use client";

import { Bell, PanelLeftClose, PanelRightOpen } from "lucide-react";
import { useSidebar } from "@/components/ui/sidebar";
import { LocationSelector } from "@/components/LocationSelector";
import { Searchbar } from "@/components/Searchbar";
import { UserMenu } from "@/components/UserMenu";

export function Navbar() {
  const { state, toggleSidebar } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <header className="flex h-16 items-center border-b bg-white px-10">

      {/* LEFT GROUP */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-sm bg-transparent hover:bg-muted transition"
        >
          {collapsed
            ? <PanelRightOpen size={20} className="w-4 h-4" />
            : <PanelLeftClose size={20} className="w-4 h-4" />
          }
        </button>

        <LocationSelector />
      </div>

      {/* CENTER GROUP */}
      <div className="flex flex-1 justify-center items-center gap-3">
        <Searchbar />
      </div>

      {/* RIGHT GROUP */}
      <div className="flex items-center gap-4">
        <Bell size={16} />
        <UserMenu />
      </div>

    </header>
  );
}