"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from "@/components/ui/sidebar";

import {
  LayoutDashboard,
  Calendar,
  Scissors,
  Users,
  ChartLine,
  UserPen,
  Hash,
  ChevronsUpDown,
  Smile,
  Globe,
  Puzzle,
  Store,
  Trophy,
  Inbox,
} from "lucide-react";

import { useAuth, type Role } from "@/context/AuthContext";
import { AppSidebarFooter } from "./SidebarFooter";

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
    label: "Inbox",
    icon: Inbox,
    href: "/dashboard/inbox/main",
    allow: ["owner", "manager"],
  },
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
    allow: ["owner", "manager"], // ❌ staff no
  },
  {
    label: "Calendario",
    icon: Calendar,
    href: "/dashboard/appointments",
    allow: ["owner", "manager"],
  },
  {
    label: "Servicios y productos",
    icon: Scissors,
    href: "/dashboard/services/overview",
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
    icon: Smile,
    href: "/dashboard/clients",
    allow: ["owner", "manager"],
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
  {
    label: "Prescencia publica",
    icon: Globe,
    href: "/dashboard/public-setup",
    allow: ["owner"],
  },
  {
    label: "Lealtad",
    icon: Trophy,
    href: "/dashboard/loyal-program",
    allow: ["owner"],
  },
  {
    label: "Configuracion del negocio",
    icon: Store,
    href: "/dashboard/bussines-setup",
    allow: ["owner"],
  },
  {
    label: "Extensiones",
    icon: Puzzle,
    href: "/dashboard/extensions",
    allow: ["owner"],
  },
  {
    label: "Estadisticas",
    icon: ChartLine,
    href: "/dashboard/statistics",
    allow: ["owner"],
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
      className=" z-50 border-none"
      style={{
        ["--sidebar-width" as any]: "280px",
        ["--sidebar-width-icon" as any]: "84px",
      }}
    >
      {/* HEADER */}
      <SidebarHeader className="pl-3 pt-7 bg-[#111113]">
        <div className="flex items-center gap-3">
          
          <h1 className="text-white font-semibold text-lg">Belza</h1>
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
