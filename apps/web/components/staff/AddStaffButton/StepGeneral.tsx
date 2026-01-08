"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StepGeneral({ name, email, role, setName, setEmail, setRole }: any) {
  return (
    <div className="space-y-4 px-5">
      <div className="flex flex-col gap-1">
        <Label>Name</Label>
        <Input
          placeholder="Jane Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-sm shadow-none bg-[#f3f3f3]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Email</Label>
        <Input
          placeholder="jane@email.com"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-sm shadow-none bg-[#f3f3f3]"
        />
      </div>

      <div className="flex flex-col gap-1">
        <Label>Role</Label>
        <select
          className="border rounded px-3 py-2 w-full bg-[#f3f3f3]"
          value={role}
          onChange={(e) => setRole(e.target.value as any)}
        >
          <option value="staff">Staff</option>
          <option value="manager">Manager</option>
        </select>
      </div>
    </div>
  );
}