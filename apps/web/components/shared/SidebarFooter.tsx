"use client"

import { LogOut, Settings } from "lucide-react"
import Link from "next/link"
import {
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"

export function AppSidebarFooter({ collapsed }: { collapsed: boolean }) {
  const { logout } = useAuth()

  return (
    <SidebarFooter className=" bg-[#111113] px-3 py-2">
      <SidebarMenu>

        {/* SETTINGS */}
        <SidebarMenuItem>
          <SidebarMenuButton
            asChild
            className={collapsed ? "justify-center ml-4" : "gap-2 px-3 py-3"}
          >
            <Link href="/settings">
              <Settings className="w-4 h-4" />
              {!collapsed && <span>Settings</span>}
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* LOGOUT */}
        <SidebarMenuItem>
          <SidebarMenuButton
            onClick={logout}
            className={`
              ${collapsed ? "justify-center ml-4" : "gap-2 px-3 py-6"}
            `}
          >
            <LogOut className="w-4 h-4" />
            {!collapsed && <span>Logout</span>}
          </SidebarMenuButton>
        </SidebarMenuItem>

      </SidebarMenu>
    </SidebarFooter>
  )
}