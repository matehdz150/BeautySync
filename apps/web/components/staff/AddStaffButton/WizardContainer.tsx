"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function WizardContainer({
  title,
  subtitle,
  steps,
  current,
  children,
  onNext,
  onBack,
  onDraft,
  nextLabel = "Next step",
  loading = false
}: {
  title: string;
  subtitle?: string;
  steps: string[];
  current: number;
  children: ReactNode;
  onNext: () => void;
  onBack?: () => void;
  onDraft?: () => void;
  nextLabel?: string;
  loading?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border w-[720px] mx-auto">
      <div className="p-6 pb-3 border-b">
        <h2 className="text-xl font-semibold">{title}</h2>
        {subtitle && (
          <p className="text-sm text-muted-foreground mt-1">
            {subtitle}
          </p>
        )}

        {/* STEPPER */}
        <div className="flex items-center gap-6 mt-5">
          {steps.map((s, i) => {
            const active = i === current;
            const completed = i < current;

            return (
              <div key={s} className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border",
                    active && "bg-primary text-white border-primary",
                    completed && "bg-green-500 text-white border-green-500",
                    !active && !completed && "bg-gray-50 text-gray-500"
                  )}
                >
                  {(i + 1).toString().padStart(2, "0")}
                </div>

                <span className={cn(
                  "text-sm",
                  active && "font-semibold",
                  completed && "text-green-600"
                )}>
                  {s}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div className="p-6 space-y-4">
        {children}
      </div>

      {/* FOOTER */}
      <div className="p-4 border-t flex justify-between bg-gray-50 rounded-b-2xl">
        <button
          className="px-4 py-2 rounded-md border text-sm hover:bg-gray-100"
          onClick={onDraft}
        >
          Save as draft
        </button>

        <div className="flex gap-2">
          {onBack && (
            <button
              className="px-4 py-2 rounded-md border text-sm hover:bg-gray-100"
              onClick={onBack}
            >
              Back
            </button>
          )}

          <button
            className="px-5 py-2 rounded-md bg-primary text-white font-medium text-sm shadow hover:opacity-90"
            onClick={onNext}
            disabled={loading}
          >
            {nextLabel} →
          </button>
        </div>
      </div>
    </div>
  );
}