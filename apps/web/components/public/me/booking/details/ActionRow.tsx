import { cn } from "@/lib/utils";
import Link from "next/link";

type ActionRowProps =
  | {
      icon: React.ReactNode;
      title: string;
      subtitle: string;
      href: string;
      onClick?: never;
      disabled?: boolean;
      className?: string;
    }
  | {
      icon: React.ReactNode;
      title: string;
      subtitle: string;
      onClick: () => void | Promise<void>;
      href?: never;
      disabled?: boolean;
      className?: string;
    };

export function ActionRow(props: ActionRowProps) {
  const { icon, title, subtitle, disabled, className } = props;

  const baseClass = cn(
    "flex items-center gap-4 rounded-2xl px-2 py-3 transition",
    "hover:bg-black/[0.03] active:scale-[0.99]",
    disabled && "pointer-events-none opacity-50",
    className
  );

  const content = (
    <>
      <div className="flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600">
        {icon}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[15px] sm:text-base font-semibold tracking-tight">
          {title}
        </p>
        <p className="text-sm text-muted-foreground truncate">{subtitle}</p>
      </div>
    </>
  );

  // 🔘 ACTION
  if ("onClick" in props) {
    return (
      <button
        type="button"
        onClick={props.onClick}
        disabled={disabled}
        className={cn(baseClass, "w-full text-left")}
      >
        {content}
      </button>
    );
  }

  // 🔗 LINK (aquí TS ya sabe que href es string)
  return (
    <Link href={props.href} className={baseClass}>
      {content}
    </Link>
  );
}