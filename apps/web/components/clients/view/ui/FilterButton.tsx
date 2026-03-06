interface Props {
  label: string;
  active: boolean;
  onClick: () => void;
}

export default function FilterButton({
  label,
  active,
  onClick,
}: Props) {
  return (
    <button
      onClick={onClick}
      className={`
        px-5 py-3 rounded-full text-sm font-medium transition
        ${
          active
            ? "bg-white text-black border"
            : "bg-muted text-muted-foreground hover:bg-muted/70"
        }
      `}
    >
      {label}
    </button>
  );
}