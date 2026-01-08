"use client";

import { Calendar, DollarSign, CalendarDays, TrendingUp, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  return (
    <div className="p-8">

      {/* HEADER */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-2xl font-semibold ">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening today.
          </p>
        </div>

        <Button className="bg-black hover:bg-emerald-700 text-white">
          + Create New Appointment
        </Button>
      </div>

      {/* CARDS GRID */}
      <div className="grid grid-cols-4 gap-4 mb-10">

        <DashboardCard
          icon={<DollarSign className="text-emerald-500" />}
          title="Today's Revenue"
          value="$1,284"
          trend="+12.5%"
        />

        <DashboardCard
          icon={<CalendarDays className="text-emerald-500" />}
          title="Appointments Today"
          value="18"
          subtitle="4 remaining"
        />

        <DashboardCard
          icon={<TrendingUp className="text-emerald-500" />}
          title="Booking Rate"
          value="87%"
          trend="+5.2%"
        />

        <DashboardCard
          icon={<XCircle className="text-red-400" />}
          title="Canceled / No-shows"
          value="2"
          subtitle="vs 5 last week"
        />

      </div>

      {/* CONTENT GRID */}
      <div className="grid grid-cols-3 gap-6">

        {/* LEFT — Today Schedule */}
        <div className="col-span-2">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-medium">Today's Schedule</h2>
            <button className="text-sm text-emerald-700 hover:underline">
              View All →
            </button>
          </div>

          <div className="space-y-3">
            {appointments.map((a) => (
              <div
                key={a.time}
                className="border rounded-xl p-4 flex justify-between items-center bg-white"
              >
                <div>
                  <p className="font-medium">{a.time} — {a.name}</p>
                  <p className="text-sm text-muted-foreground">{a.service}</p>
                  <p className="text-sm opacity-70">👤 {a.staff}</p>
                </div>

                <StatusBadge status={a.status} />
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT — Calendar */}
        <div>
          <CalendarCard />
        </div>

      </div>
    </div>
  );
}


/* ---- SMALL COMPONENTS ---- */

function DashboardCard({ icon, title, value, subtitle, trend }: any) {
  return (
    <div className="border rounded-2xl bg-white p-5 shadow-sm">
      <div className="flex justify-between mb-2">
        <p className="text-sm text-muted-foreground">{title}</p>
        {icon}
      </div>

      <h2 className="text-2xl font-semibold">{value}</h2>

      {trend && <p className="text-emerald-600 text-sm">{trend}</p>}
      {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}


function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Confirmed: "bg-emerald-100 text-emerald-700",
    Pending: "bg-amber-100 text-amber-700",
    Paid: "bg-sky-100 text-sky-700"
  };

  return (
    <span className={`px-3 py-1 rounded-full text-sm ${colors[status]}`}>
      {status}
    </span>
  );
}


/* ---- MOCK DATA ---- */

const appointments = [
  { time: "9:00 AM", name: "Emma Wilson", service: "Haircut & Styling", staff: "Maria Santos", status: "Confirmed" },
  { time: "10:30 AM", name: "James Rodriguez", service: "Beard Trim", staff: "Alex Chen", status: "Paid" },
  { time: "11:00 AM", name: "Sophie Taylor", service: "Manicure & Pedicure", staff: "Lisa Park", status: "Pending" },
];


function CalendarCard() {
  return (
    <div className="border rounded-2xl bg-white p-5 shadow-sm">

      <div className="flex justify-between mb-3">
        <h2 className="font-medium">December 2025</h2>
      </div>

      <div className="grid grid-cols-7 gap-2 text-center text-sm">
        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(d => (
          <div key={d} className="text-muted-foreground">{d}</div>
        ))}

        {/* Simple dummy boxes */}
        {Array.from({length: 31}).map((_,i)=>(
          <div
            key={i}
            className={`
              py-2 rounded-lg
              ${i+1 === 28 ? "bg-emerald-500 text-white" : "bg-gray-50"}
            `}
          >
            {i+1}
          </div>
        ))}
      </div>

      <div className="flex gap-4 mt-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 bg-emerald-200 rounded"></span> Fully booked
        </span>
        <span className="flex items-center gap-1">
          <span className="h-3 w-3 bg-amber-200 rounded"></span> Moderate
        </span>
      </div>
    </div>
  );
}