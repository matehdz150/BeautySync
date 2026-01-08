"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { CategoryIcon } from "../../shared/Icon";

type Props = {
  icon?: string;
  color?: string;
  label: string;
};

export function CategoryBadgeIcon({ icon, color = "#E5E7EB", label }: Props) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge
            variant="secondary"
            className="flex items-center justify-center h-10 w-10 rounded-full cursor-default"
            style={{
              background: `${color}70`,
              color,
              borderColor: `${color}95`,
            }}
          >
            <CategoryIcon name={icon} className="w-4 h-4" />
          </Badge>
        </TooltipTrigger>

        <TooltipContent side="top">
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}