"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  LoaderPinwheel,
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  CircleUser,
  ChartLine,
  UserPen,
  LogOut,
  Settings,
  Hash,
  ChevronsUpDown,
} from "lucide-react";

import { useAuth, type Role } from "@/context/AuthContext";
import { UserMenu } from "../UserMenu";
import { AppSidebarFooter } from "./SidebarFooter";
import { Kbd, KbdGroup } from "../ui/kbd";

// ====== TIPOS ======

type NavItem = {
  label: string;
  icon: any;
  href: string;
  allow: Role[]; // 👈 controla quién lo puede ver
};

// ====== MENÚ DEFINIDO POR ROL ======

const items: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    allow: ["owner", "manager"], // ❌ staff no
  },
  {
    label: "Citas",
    icon: Calendar,
    href: "/dashboard/appointments",
    allow: ["owner", "manager"],
  },
  {
    label: "Servicios",
    icon: Scissors,
    href: "/dashboard/services",
    allow: ["owner", "manager"],
  },
  {
    label: "Staff",
    icon: Users,
    href: "/dashboard/staff/overview",
    allow: ["owner", "manager"],
  },
  {
    label: "Clientes",
    icon: CircleUser,
    href: "/dashboard/clients",
    allow: ["owner", "manager"],
  },
  {
    label: "Estadisticas",
    icon: ChartLine,
    href: "/dashboard/statistics",
    allow: ["owner"],
  },
  {
    label: "Tus citas",
    icon: Calendar,
    href: "/dashboard/staff-cita",
    allow: ["staff"],
  },
  {
    label: "Editar perfil",
    icon: UserPen,
    href: "/dashboard/profile",
    allow: ["staff"],
  },
];

// ====== COMPONENTE ======

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const pathname = usePathname();

  const { user } = useAuth();

  // 🔐 filtrar por rol
  const visibleItems = user
    ? items.filter((i) => i.allow.includes(user.role as Role))
    : [];

  return (
    <Sidebar
      collapsible="icon"
      className="bg-[#f6f6f6] border-none"
      style={{
        ["--sidebar-width" as any]: "280px",
        ["--sidebar-width-icon" as any]: "84px",
      }}
    >
      {/* HEADER */}
      <SidebarHeader className="p-6 pb-8 bg-[#111113]">
        <div className="flex items-center gap-3">
          <div className="h-9 w-11 rounded-sm bg-indigo-400 flex items-center justify-center">
            <Hash className="text-white" />
          </div>

          {!collapsed && (
            <div className="flex flex-col leading-tight w-full">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-lg text-white">BeautySync</span>
                <ChevronsUpDown size={15} />
              </div>
              <span className="text-xs text-muted-foreground">
                Manager Dashboard
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      {!collapsed && (
        <div className="flex items-center bg-[#111113] px-6">
        <div className="flex border-b w-full pb-2 border-muted-foreground">
          {/* Línea + texto */}
          <div className="flex-1 text-sm font-normal text-muted-foreground">Quick actions</div>

          {/* Badge */}
          <div className="ml-3 flex gap-1 items-center bg-muted-foreground font-light text-xs px-2 py-1 rounded-sm">
            <span>⌘</span>
            <span>K</span>
          </div>
        </div>
      </div>
      )}


      {/* MENU */}
      <SidebarContent className="flex flex-col h-full bg-[#111113]">
        <SidebarMenu className="px-2 pr-2 py-3 space-y-1">
          {visibleItems.map((item) => {
            const Icon = item.icon;

            const active =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <SidebarMenuItem key={item.label}>
                <SidebarMenuButton
                  asChild
                  className={`
      rounded-lg transition-all text-sm
      ${collapsed ? "justify-center ml-3" : "gap-2 px-3"}
      ${
        active
          ? "bg-indigo-400 text-muted"
          : "text-muted-foreground hover:bg-muted-foreground"
      }
      h-10
    `}
                >
                  <Link href={item.href} className="flex items-center gap-2">
                    <Icon className="w-4 h-4" strokeWidth={2.4} />
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      {/* FOOTER */}
      <AppSidebarFooter collapsed={collapsed} />
    </Sidebar>
  );
}
