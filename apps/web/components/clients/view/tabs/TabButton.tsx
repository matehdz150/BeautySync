interface Props {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function TabButton({ label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`
        px-4 py-2 rounded-full text-sm font-medium transition
        ${
          active
            ? "bg-black text-white"
            : "text-muted-foreground hover:bg-muted"
        }
      `}
    >
      {label}
    </button>
  );
}