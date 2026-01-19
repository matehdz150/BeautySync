import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { Navbar } from "@/components/shared/navbar";
import { PaymentProvider } from "@/context/PaymentContext";

export default function SidebarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
      <SidebarProvider>
      {/* Sidebar fijo a la izquierda */}
      <AppSidebar />

      {/* TODO el contenido que debe ajustarse va aquí */}
      <SidebarInset className="flex flex-col h-screen bg-transparent pt-3 pl-6 z-10">
        <div className="bg-white rounded-xl rounded-r-none rounded-bl-none border w-full flex flex-col overflow-hidden h-full">
          <Navbar />

          {/* Este main ya sí tiene un contenedor padre de altura fija */}
          <main className="flex-1 overflow-hidden">
              {children}
            </main>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
