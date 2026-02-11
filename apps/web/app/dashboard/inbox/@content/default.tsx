import { MousePointerClick } from "lucide-react";

export default function DefaultContent() {
  return (
    <div className="flex flex-col h-full items-center justify-center text-muted-foreground">
      <MousePointerClick/>
      Selecciona un mensaje
    </div>
  );
}