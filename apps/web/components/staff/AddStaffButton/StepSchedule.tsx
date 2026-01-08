"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StepSchedule({ startTime, endTime, setStartTime, setEndTime }: any) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Start time</Label>
          <Input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
          />
        </div>

        <div>
          <Label>End time</Label>
          <Input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        This schedule will apply Monday—Saturday.  
        You can edit specific days later.
      </p>
    </div>
  );
}