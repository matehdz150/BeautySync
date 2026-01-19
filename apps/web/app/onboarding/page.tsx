"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { Button } from "@/components/ui/button";

import { onboardOwner } from "@/lib/services/onboarding";
import { api } from "@/lib/services/api";
import { useAuth } from "@/context/AuthContext";
import { useBranch } from "@/context/BranchContext";

import { StepIndicator } from "@/components/onBoarding/StepIndicator";
import { StepBusinessInfo } from "@/components/onBoarding/StepBusinessInfo";
import { StepBranchInfo } from "@/components/onBoarding/StepBranchInfo";
import { StepDone } from "@/components/onBoarding/StepDone";
import { StepSetLocation } from "@/components/onBoarding/StepSetLocation";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, updateUserOrg } = useAuth();
  const { setBranch } = useBranch();

  // ✅ 1 = business, 2 = branch name, 3 = set location, 4 = done
  const [step, setStep] = useState(1);

  const [organizationName, setOrganizationName] = useState("");
  const [branchName, setBranchName] = useState("");
  const [branchAddress, setBranchAddress] = useState("");
  const [branchLat, setBranchLat] = useState<number | null>(null);
  const [branchLng, setBranchLng] = useState<number | null>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasCoords =
    typeof branchLat === "number" && typeof branchLng === "number";

  useEffect(() => {
    if (!user) router.push("/login");
    else if (user.role !== "owner") router.push("/dashboard");
    else if (!user.needsOnboarding && step !== 4) router.push("/dashboard");
  }, [user, step, router]);

  const canContinue = useMemo(() => {
    if (loading) return false;

    if (step === 1) return organizationName.trim().length >= 2;
    if (step === 2) return branchName.trim().length >= 2 && branchAddress.length >=2;
    if (step === 3) return hasCoords; 
    return false;
  }, [loading, step, organizationName, branchName, branchAddress, hasCoords]);

  async function submit() {
    setLoading(true);
    setError(null);

    try {
      const res = await onboardOwner({
        organizationName,
        branches: [
          {
            name: branchName,
            address: branchAddress,
            lat: branchLat ?? undefined,
            lng: branchLng ?? undefined,
          },
        ],
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

      setStep(4);
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  function goBack() {
    if (loading) return;
    setError(null);

    setStep((s) => Math.max(1, s - 1));
  }

  async function goNext() {
    if (loading) return;
    setError(null);

    if (step === 3) {
      // 🔥 ya tenemos coords -> submit final
      await submit();
      return;
    }

    setStep((s) => Math.min(4, s + 1));
  }

  return (
    <div className="h-dvh bg-white overflow-hidden">
      <div className="h-full flex flex-col">
        {/* HEADER fijo */}
        <div className="shrink-0 bg-white">
          <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-6">
            <StepIndicator step={step} />

            <div className="flex justify-between items-center w-full mt-4">
              <Button
                variant="outline"
                disabled={step === 1 || loading}
                onClick={goBack}
                className="shadow-none"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>

              {/* Botón derecha */}
              {step < 4 && (
                <motion.div whileTap={{ scale: 0.96 }}>
                  <Button disabled={!canContinue} onClick={goNext}>
                    {loading && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}

                    {step === 3 ? "Finish setup" : "Continue"}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>

        {/* CONTENIDO scrolleable */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-[1500px] mx-auto px-6 md:px-10 py-8">
            {error && <p className="text-red-500 mb-6">{error}</p>}

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

              {step === 3 && (
                <StepSetLocation
                  key="step3"
                  branchName={branchName}
                  branchAddress={branchAddress}
                  setBranchAddress={setBranchAddress}
                  branchLat={branchLat}
                  setBranchLat={setBranchLat}
                  branchLng={branchLng}
                  setBranchLng={setBranchLng}
                />
              )}

              {step === 4 && (
                <StepDone
                  key="step4"
                  onFinish={() => router.replace("/dashboard")}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}