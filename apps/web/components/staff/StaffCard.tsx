"use client";

import {
  Mail,
  Clock,
  Star,
  Calendar,
  MoreVertical,
  Scissors,
  Hand,
  Flower2,
  Sparkles,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, pastelize } from "@/lib/utils";
import { StaffService } from "@/lib/services/staff";
import { CategoryIcon } from "../shared/Icon";

export type StaffMember = {
  id: string;
  name: string;
  role: string;
  email: string | null;
  avatar: string | null;
  services: StaffService[];
  schedule: string;
  status: "pending" | "active" | "inactive";
  appointmentsToday: number;
  rating: number;
  totalClients: number;
};

// 🔹 estilos por servicio
const getServiceStyle = (serviceName: string) => {
  const s = serviceName.toLowerCase();

  if (s.includes("hair") || s.includes("cut") || s.includes("color"))
    return { icon: Scissors, color: "text-emerald-700", bg: "bg-emerald-50" };

  if (s.includes("beard") || s.includes("shave"))
    return { icon: Scissors, color: "text-sky-700", bg: "bg-sky-50" };

  if (s.includes("nail") || s.includes("mani") || s.includes("pedi"))
    return { icon: Hand, color: "text-amber-700", bg: "bg-amber-50" };

  if (s.includes("massage") || s.includes("tissue"))
    return { icon: Flower2, color: "text-rose-700", bg: "bg-rose-50" };

  return { icon: Sparkles, color: "text-zinc-700", bg: "bg-zinc-100" };
};

export function StaffCard({
  member,
  index,
}: {
  member: StaffMember;
  index: number;
}) {
  const initials = member.name
    .split(" ")
    .map((n) => n[0])
    .join("");

  return (
    <div
      className={cn(
        "group relative bg-card rounded-2xl border overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 animate-fade-in",
        member.status === "active"
          ? "border-border/60 hover:border-primary/30"
          : member.status === "pending"
          ? "border-amber-200/80 hover:border-amber-400/60"
          : "border-border/40 opacity-75 hover:opacity-100"
      )}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Status bar */}
      <div
        className={cn(
          "h-1",
          member.status === "active"
            ? "bg-[#d9f7d7]"
            : member.status === "pending"
            ? "bg-gradient-to-r from-amber-400/60 to-amber-200/40"
            : "bg-muted"
        )}
      />

      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Avatar className="w-16 h-16 border-2 border-card shadow-md">
                <AvatarImage src={member.avatar ?? ""} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>

              {/* Puntito de estado */}
              {member.status !== "inactive" && (
                <div
                  className={cn(
                    "absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white",
                    member.status === "active"
                      ? "bg-[#149610]"
                      : "bg-amber-400"
                  )}
                />
              )}
            </div>

            <div>
              <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                {member.name}
              </h3>

              <p className="text-sm text-muted-foreground">{member.role}</p>

              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                <span className="text-sm font-medium">{member.rating}</span>
                <span className="text-xs text-muted-foreground">
                  • {member.totalClients} clients
                </span>
              </div>
            </div>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>View Profile</DropdownMenuItem>
              <DropdownMenuItem>Edit Details</DropdownMenuItem>
              <DropdownMenuItem>View Schedule</DropdownMenuItem>
              <DropdownMenuItem className="text-red-500">
                Deactivate
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Contact */}
        <div className="space-y-2 mb-4 pb-4 border-b">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="w-4 h-4" />
            <span className="truncate">
              {member.email ?? "No email provided"}
            </span>
          </div>

          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 mt-1" />

            <div className="space-y-0.5 leading-relaxed">
              {member.schedule
                ? member.schedule
                    .split("·")
                    .map((line) => <div key={line.trim()}>{line.trim()}</div>)
                : "No schedule set"}
            </div>
          </div>
        </div>

        {/* Services */}
        <div className="mb-4">
          <p className="text-xs font-medium text-muted-foreground uppercase mb-2">
            Services
          </p>

          <div className="flex flex-wrap gap-2">
            {member.services.map((service) => {
              const Icon = service.categoryIcon;

              return (
                <div
                  key={service.id}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border"
                  style={{
                    backgroundColor: pastelize(
                      service.categoryColor ?? "#7C3AED"
                    ),
                    borderColor: service.categoryColor ?? "#7C3AED",
                    color: service.categoryColor ?? "#7C3AED",
                  }}
                >
                  <CategoryIcon
  name={service?.categoryIcon || undefined}
  className="w-3 h-3"
/>

                  {service.name}
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              member.status === "active"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : member.status === "pending"
                ? "bg-amber-50 text-amber-700 border-amber-200"
                : "bg-muted text-muted-foreground"
            )}
          >
            {member.status === "active"
              ? "● Activo"
              : member.status === "pending"
              ? "● Invitacion enviada"
              : "○ Inactive"}
          </Badge>

          <div className="flex items-center gap-1.5 text-sm">
            <Calendar className="w-4 h-4 text-primary" />
            <span className="font-medium">{member.appointmentsToday}</span>
            <span className="text-muted-foreground">today</span>
          </div>
        </div>
      </div>
    </div>
  );
}
