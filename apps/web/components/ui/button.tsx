"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/* =====================================================
   VARIANTS
===================================================== */

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: `
          text-white
          bg-[linear-gradient(90deg,#000000_0%,#000000_50%,#818CF8_50%,#818CF8_100%)]
          bg-[length:200%_100%]
          bg-left
          transition-[background-position,box-shadow]
          duration-500
          ease-in-out
          hover:bg-right
          hover:shadow-[0_8px_25px_rgba(129,140,248,0.35)]
        `,
        primary: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost:
          "hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

/* =====================================================
   TYPES
===================================================== */

type ButtonProps =
  React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;

    /** Tooltip content (string o JSX) */
    tooltip?: React.ReactNode;

    /** Tooltip side */
    tooltipSide?: "top" | "right" | "bottom" | "left";

    /** Tooltip align */
    tooltipAlign?: "start" | "center" | "end";

    /** Deshabilitar tooltip */
    tooltipDisabled?: boolean;
  };

/* =====================================================
   COMPONENT
===================================================== */

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,

  tooltip,
  tooltipSide = "top",
  tooltipAlign = "center",
  tooltipDisabled = false,

  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  const button = (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );

  /* =====================
     SIN TOOLTIP
  ===================== */
  if (!tooltip || tooltipDisabled) {
    return button;
  }

  /* =====================
     CON TOOLTIP
  ===================== */
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide} align={tooltipAlign}>
          {typeof tooltip === "string" ? (
            <p className="text-sm">{tooltip}</p>
          ) : (
            tooltip
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export { Button, buttonVariants };