"use client";

import { useEffect, useState } from "react";
import { Search, Calendar, Star, Users } from "lucide-react";

import { Input } from "@/components/ui/input";
import { StaffCard, type StaffMember } from "@/components/staff/StaffCard";
import { AddStaffButton } from "@/components/staff/AddStaffButton/AddStaffButton";
import { ProtectedRoute } from "@/components/shared/ProtectedRoute";
import { useBranch } from "@/context/BranchContext";
import { API_URL } from "@/lib/services/api";
import { getStaffByBranch } from "@/lib/services/staff";

export default function StaffPage() {
  const { branch } = useBranch();

  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeRole, setActiveRole] = useState("All Roles");
  const [statusFilter, setStatusFilter] = useState<
    "all" | "active" | "inactive" | "pending"
  >("all");

  useEffect(() => {
    if (!branch) return;

    async function load() {
      try {
        const data = await getStaffByBranch(branch.id);

        console.log("STAFF API →", data);

        const mapped: StaffMember[] = data.map((s: any) => ({
          id: s.id,
          name: s.name,
          email: s.email ?? "—",
          role: s.role ?? "Staff",
          avatar: s.avatarUrl ?? "",

          services: Array.isArray(s.services)
            ? s.services.map((srv: any) => ({
                id: srv.id,
                name: srv.name,
                category: srv.category ?? "Uncategorized",
                categoryColor: srv.categoryColor ?? "#E5E7EB",
                categoryIcon: srv.categoryIcon ?? null,
              }))
            : [],

          schedule: s.schedule ?? "No schedule set",
          status: s.status as "pending" | "active" | "inactive",
          appointmentsToday: s.appointmentsToday ?? 0,
          rating: s.rating ?? 5,
          totalClients: s.totalClients ?? 0,
        }));

        setStaffMembers(mapped);
      } catch (err) {
        console.error("FAILED LOADING STAFF", err);
      }
    }

    load();
  }, [branch]);

  const filteredStaff = staffMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.role.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      activeRole === "All Roles" || member.role === activeRole;

    const matchesStatus =
      statusFilter === "all" || member.status === statusFilter;

    return matchesSearch && matchesRole && matchesStatus;
  });

  const activeCount = staffMembers.filter((m) => m.status === "active").length;

  return (
    <ProtectedRoute allow={["owner"]}>
      <main className="p-6 space-y-6 max-w-7xl mx-auto" >
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold">Staff</h1>
            <p className="text-sm text-muted-foreground">
              Manage your team members and schedules
            </p>
          </div>

          <AddStaffButton />
        </div>

        {/* QUICK STATS */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            icon={<Users className="w-5 h-5 text-primary" />}
            value={staffMembers.length}
            label="Total Staff"
          />
          <StatCard
            icon={<Star className="w-5 h-5 text-amber-500" />}
            value={(5.0).toFixed(1)}
            label="Avg Rating"
          />
          <StatCard
            icon={<Calendar className="w-5 h-5 text-emerald-600" />}
            value={staffMembers.reduce((a, m) => a + m.appointmentsToday, 0)}
            label="Appointments Today"
          />
          <StatCard
            icon={<Users className="w-5 h-5 text-sky-600" />}
            value={activeCount}
            label="Active"
          />
        </div>

        {/* SEARCH BAR */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or role…"
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filteredStaff.map((m, i) => (
            <StaffCard key={m.id} member={m} index={i} />
          ))}
        </div>
      </main>
    </ProtectedRoute>
  );
}

/* ===== SIMPLE COMPONENTS ===== */

function StatCard({
  icon,
  value,
  label,
}: {
  icon: React.ReactNode;
  value: string | number;
  label: string;
}) {
  return (
    <div className="bg-[white] rounded-xl border p-4  flex gap-3 items-center">
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
