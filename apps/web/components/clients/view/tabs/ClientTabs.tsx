import TabButton from "./TabButton";

interface Props {
  activeTab: string;
  setActiveTab: (tab: any) => void;
}

export default function ClientTabs({ activeTab, setActiveTab }: Props) {
  return (
    <div className="px-6 pt-6">
      <div className="flex gap-2 border-b pb-4">
        <TabButton
          label="Citas"
          active={activeTab === "overview"}
          onClick={() => setActiveTab("overview")}
        />

        <TabButton
          label="Reseñas"
          active={activeTab === "reviews"}
          onClick={() => setActiveTab("reviews")}
        />

        <TabButton
          label="Ventas"
          active={activeTab === "sales"}
          onClick={() => setActiveTab("sales")}
        />

        <TabButton label="Mensajes" active={false} onClick={() => {}} />

        <TabButton
          label="Beneficios y recompensas"
          active={activeTab === "rewards"}
          onClick={() => setActiveTab("rewards")}
        />

        <TabButton label="Estadisticas" active={false} onClick={() => {}} />
      </div>
    </div>
  );
}