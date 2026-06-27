import { Info } from 'lucide-react';

type TooltipProps = {
  text: string;
};

export function Tooltip({ text }: TooltipProps) {
  return (
    <span className="group relative inline-flex">
      <Info size={15} className="text-ink/45 transition group-hover:text-hide" aria-hidden="true" />
      <span
        role="tooltip"
        className="pointer-events-none absolute right-0 top-6 z-10 w-56 rounded-md border border-black/10 bg-white px-3 py-2 text-xs leading-5 text-ink/72 opacity-0 shadow-soft transition group-hover:opacity-100"
      >
        {text}
      </span>
    </span>
  );
}
