import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Navbar } from "@/components/shared/navbar";
import { PaymentProvider } from "@/context/PaymentContext";

import { NotificationsProvider } from "@/context/NotificationsContext";
import { NotificationsRealtimeBridge } from "@/components/notifications/NotificationsRealtimeBridge";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <NotificationsProvider>
        {/* 🔥 SSE vive aquí */}
        <NotificationsRealtimeBridge />

        <AppSidebar />

        <SidebarInset className="flex flex-col h-screen pt-3 pl-6 bg-[#111113]">
          <div className="bg-white rounded-xl rounded-r-none rounded-bl-none border w-full flex flex-col overflow-hidden h-full z-50">
            <Navbar />

            <main className="flex-1 overflow-hidden">
              {children}
            </main>
          </div>
        </SidebarInset>
      </NotificationsProvider>
    </SidebarProvider>
  );
}