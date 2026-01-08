"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip";

type Props = {
  names: string[];   // eg: ["Juan Perez", "Maria Lopez"]
};

function initials(name: string) {
  return name
    .split(" ")
    .map(n => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function colorFromName(name: string) {
  const colors = [
    "#000"
  ];

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }

  return colors[Math.abs(hash) % colors.length];
}

export function StaffAvatarGroup({ names }: Props) {
  if (!names?.length)
    return <span className="text-sm text-muted-foreground">No asignado</span>;

  return (
    <TooltipProvider>
      <div className="flex items-center">

        {names.slice(0, 4).map((name, i) => (
          <Tooltip key={i}>
            <TooltipTrigger asChild>
              <div className="-ml-2 first:ml-0 cursor-default">
                <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                  <AvatarImage src="" alt={name} />
                  <AvatarFallback
                    style={{ backgroundColor: colorFromName(name) }}
                    className="text-white font-semibold text-xs"
                  >
                    {initials(name)}
                  </AvatarFallback>
                </Avatar>
              </div>
            </TooltipTrigger>

            <TooltipContent side="top">
              {name}
            </TooltipContent>
          </Tooltip>
        ))}

        {names.length > 4 && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="-ml-2 h-7 w-7 rounded-full bg-neutral-200 ring-2 ring-white flex items-center justify-center text-[11px] font-medium cursor-default shadow-sm">
                +{names.length - 4}
              </div>
            </TooltipTrigger>

            <TooltipContent>
              {names.slice(4).join(", ")}
            </TooltipContent>
          </Tooltip>
        )}

      </div>
    </TooltipProvider>
  );
}