"use client";

import { useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

import {
  Dialog, DialogTrigger, DialogContent,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

import { StepGeneral } from "./StepGeneral";
import { StepSchedule } from "./StepSchedule";
import { StepReview } from "./StepReview";

import { StepperBadge } from "@/components/shared/stepper-badge";

import { useBranch } from "@/context/BranchContext";
import { createStaff, inviteStaff } from "@/lib/services/staff";
import { saveDefaultScheduleForStaff } from "@/lib/services/staffSchedules";

export function AddStaffButton() {
  const { branch } = useBranch();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);

  const steps = ["General", "Schedule", "Review"];

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("staff");

  const [startTime, setStartTime] = useState("10:00");
  const [endTime, setEndTime] = useState("18:00");

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit() {
    setLoading(true);
    setErr(null);

    try {
      const staff = await createStaff({ name, email, branchId: branch!.id });

      await saveDefaultScheduleForStaff({
        staffId: staff.id,
        days: [1, 2, 3, 4, 5, 6],
        startTime,
        endTime,
      });

      await inviteStaff({ email, staffId: staff.id, role });

      setMsg("Staff created 🎉");
      setStep(4);

      setTimeout(() => setOpen(false), 900);
    } catch (e: any) {
      setErr(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="gap-2 shadow-md">
          <Plus /> Add Staff
        </Button>
      </DialogTrigger>

      <DialogContent className="p-0 bg-transparent border-none shadow-none max-w-2xl">
        <div className="bg-white rounded-2xl shadow-xl border">
          <div className="p-6 pb-4 border-b">
            <DialogHeader>
              <DialogTitle className="text-xl">
                Add Staff Member
              </DialogTitle>
              <p className="text-sm text-muted-foreground">
                Create the staff profile & set availability.
              </p>
            </DialogHeader>

            <StepperBadge steps={steps} step={step} />
          </div>

          <div className="p-6 space-y-6">
            {err && <p className="text-red-500">{err}</p>}
            {msg && <p className="text-green-600">{msg}</p>}

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="general"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <StepGeneral {...{ name, email, role, setName, setEmail, setRole }} />
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="schedule"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                >
                  <StepSchedule {...{ startTime, endTime, setStartTime, setEndTime }} />
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="review"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <StepReview {...{ name, email, role, startTime, endTime }} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="p-4 border-t bg-gray-50 rounded-b-2xl flex justify-between">
            <Button
              variant="outline"
              disabled={step === 1 || loading}
              onClick={() => setStep((s) => s - 1)}
            >
              Previous
            </Button>

            {step < 3 && (
              <Button
                onClick={() => setStep((s) => s + 1)}
                disabled={
                  loading ||
                  (step === 1 && (!name || !email)) ||
                  (step === 2 && !startTime)
                }
              >
                Continue
              </Button>
            )}

            {step === 3 && (
              <Button onClick={submit} disabled={loading}>
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Finish & Invite
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}