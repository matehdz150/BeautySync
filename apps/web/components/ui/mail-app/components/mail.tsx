"use client";

import * as React from "react";
import { Search } from "lucide-react";

import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TooltipProvider } from "@/components/ui/tooltip";

import { MailDisplay } from "./mail-display";
import { MailDisplayMobile } from "./mail-display-mobile";
import { MailList } from "./mail-list";
import { NavDesktop } from "./nav-desktop";
import { NavMobile } from "./nav-mobile";

import { type Mail } from "../data";
import { useMail } from "../mail-context";

interface MailProps {
  accounts: {
    label: string;
    email: string;
    icon: React.ReactNode;
  }[];
  mails: Mail[];
  defaultLayout?: number[];
  defaultCollapsed?: boolean;
  navCollapsedSize: number;
}

export function Mail({
  mails,
  defaultLayout = [20, 32, 48],
  defaultCollapsed = false,
  navCollapsedSize,
}: MailProps) {
  const [isCollapsed] = React.useState(defaultCollapsed);
  const [tab, setTab] = React.useState<"all" | "unread">("all");

  const isMobile = useIsMobile();

  // 🔥 CONTEXTO
  const { selectedMail } = useMail();

  const filteredMails =
    tab === "all"
      ? mails
      : mails.filter((item) => item.read === false);

  const activeMail =
    mails.find((item) => item.id === selectedMail?.id) ?? null;

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        direction="horizontal"
        className="items-stretch"
      >
        {/* =====================
            NAV (LEFT)
        ===================== */}
        <ResizablePanel
          hidden={isMobile}
          defaultSize={defaultLayout[0]}
          collapsedSize={navCollapsedSize}
          collapsible
          minSize={15}
          maxSize={20}
          className={cn(
            isCollapsed &&
              "min-w-[50px] transition-all duration-300 ease-in-out"
          )}
        >
          <NavDesktop isCollapsed={isCollapsed} />
        </ResizablePanel>

        <ResizableHandle hidden={isMobile} withHandle />

        {/* =====================
            LIST (CENTER)
        ===================== */}
        <ResizablePanel defaultSize={defaultLayout[1]} minSize={30}>
          <Tabs
            value={tab}
            onValueChange={(value) =>
              setTab(value as "all" | "unread")
            }
            className="flex h-full flex-col gap-0"
          >
            <div className="flex items-center px-4 py-2">
              <div className="flex items-center gap-2">
                {isMobile && <NavMobile />}
                <h1 className="text-xl font-bold">Inbox</h1>
              </div>

              <TabsList className="ml-auto">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="unread">Unread</TabsTrigger>
              </TabsList>
            </div>

            <Separator />

            <div className="bg-background/95 supports-[backdrop-filter]:bg-background/60 p-4 backdrop-blur">
              <form>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search" className="pl-8" />
                </div>
              </form>
            </div>

            <div className="min-h-0">
              <MailList items={filteredMails} />
            </div>
          </Tabs>
        </ResizablePanel>

        <ResizableHandle hidden={isMobile} withHandle />

        {/* =====================
            DISPLAY (RIGHT)
        ===================== */}
        <ResizablePanel
          defaultSize={defaultLayout[2]}
          hidden={isMobile}
          minSize={30}
        >
          {isMobile ? (
            <MailDisplayMobile mail={activeMail} />
          ) : (
            <MailDisplay mail={activeMail} />
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}