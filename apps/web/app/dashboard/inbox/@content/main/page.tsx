import { Inbox } from "lucide-react";

export default function InboxMainContent() {
  return (
    <div className="h-full flex items-center justify-center bg-background">
      <div className="flex flex-col items-center text-center max-w-md px-6">
        
        {/* Icon */}
        <div className="h-20 w-20 rounded-3xl bg-muted/40 flex items-center justify-center mb-6">
          <Inbox className="h-10 w-10 text-muted-foreground" />
        </div>

        {/* Title */}
        <h2 className="text-xl font-semibold mb-2">
          Selecciona una notificación
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground leading-relaxed">
          Aquí podrás ver el detalle completo de tus citas, mensajes y 
          notificaciones importantes.
        </p>

        {/* Subtle hint */}
        <p className="text-xs text-muted-foreground mt-6">
          Elige una conversación del panel izquierdo para comenzar.
        </p>

      </div>
    </div>
  );
}