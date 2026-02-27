// app/clients/[clientid]/layout.tsx


import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export default function ClientLayout({ children }: Props) {
  return (
    <div className="h-screen flex flex-col bg-muted/40">
      {/* Aquí puedes poner header, breadcrumbs, etc */}
      
      {children}
    </div>
  );
}