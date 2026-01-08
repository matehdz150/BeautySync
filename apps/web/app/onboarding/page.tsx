// app/onboarding/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { onboardOwner } from "@/lib/services/onboarding";
import { api } from "@/lib/services/api";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";

import { StepIndicator } from "@/components/onBoarding/StepIndicator";
import { StepBusinessInfo } from "@/components/onBoarding/StepBusinessInfo";
import { StepBranchInfo } from "@/components/onBoarding/StepBranchInfo";
import { StepDone } from "@/components/onBoarding/StepDone";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUserOrg } = useAuth();
  const { setBranch } = useBranch();

  const [step, setStep] = useState(1);

  const [organizationName, setOrganizationName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
  if (!user) router.push("/login");
  else if (user.role !== "owner") router.push("/dashboard");
  else if (!user.needsOnboarding && step !== 3) router.push("/dashboard");
}, [user, step]);

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      const res = await onboardOwner({
        organizationName,
        branches: [{ name: branchName, address: branchAddress }],
      });

      const { token, organizationId } = res;

      localStorage.setItem("accessToken", token);

      const organization = await api(`/organizations/${organizationId}`);
      const branches = await api(`/branches/organization/${organizationId}`);
      const branch = branches[0];

      localStorage.setItem("organization", JSON.stringify(organization));
      localStorage.setItem("branch", JSON.stringify(branch));

      updateUserOrg(organizationId);
      setBranch(branch);

      setStep(3);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex justify-center bg-white pb-100">
      <Card className="w-full bg-transparent shadow-none border-none">
        <CardHeader>
          <StepIndicator step={step} />

          {/* BOTONES — MISMA FILA */}
          <div className="flex justify-between items-center w-full mt-4">
            {/* ⬅️ PREVIOUS */}
            <Button
              variant="outline"
              disabled={step === 1 || loading}
              onClick={() => setStep((s) => s - 1)}
              className="shadow-none"
            >
              <ArrowLeft className="h-4 w-4"/>
            </Button>

            {/* ➡️ CONTINUE */}
            {step < 3 && (
              <motion.div whileTap={{ scale: 0.96 }}>
                <Button
                  disabled={
                    loading ||
                    (step === 1 && !organizationName) ||
                    (step === 2 && !branchName)
                  }
                  onClick={async () =>
                    step === 2 ? await submit() : setStep(step + 1)
                  }
                >
                  {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}

                  {step === 2 ? "Finish setup" : "Continue"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="space-y-8 border-none">
          {error && <p className="text-red-500">{error}</p>}

          <AnimatePresence mode="wait">
            {step === 1 && (
              <StepBusinessInfo
                key="step1"
                value={organizationName}
                onChange={setOrganizationName}
              />
            )}

            {step === 2 && (
              <StepBranchInfo
                key="step2"
                branchName={branchName}
                setBranchName={setBranchName}
                branchAddress={branchAddress}
                setBranchAddress={setBranchAddress}
              />
            )}

            {step === 3 && <StepDone key="step3" onFinish={() => router.replace("/dashboard")}/>}
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
