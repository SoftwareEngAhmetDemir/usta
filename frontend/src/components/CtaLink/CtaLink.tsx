import { ChevronRight, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router';

interface Props {
  to: string;
  icon: LucideIcon;
  title: string;
  hint: string;
}

/** The screen's main way forward as a big steel card (e.g. "Makineye sor", "Makine tara"). */
export function CtaLink({ to, icon: Icon, title, hint }: Props) {
  return (
    <Link
      to={to}
      className="group flex items-center gap-3 rounded-xl bg-steel p-4 text-steel-foreground no-underline shadow-md transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/60 focus-visible:outline-none"
    >
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground" aria-hidden="true">
        <Icon className="size-6" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <b className="text-lg leading-tight">{title}</b>
        <small className="text-sm text-white/75">{hint}</small>
      </span>
      <ChevronRight className="size-5 shrink-0 text-white/60 transition-transform group-hover:translate-x-0.5 rtl:rotate-180" aria-hidden="true" />
    </Link>
  );
}
