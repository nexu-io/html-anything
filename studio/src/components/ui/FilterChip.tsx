import type { ButtonHTMLAttributes } from "react";

interface FilterChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

export function FilterChip({ active, className = "", ...props }: FilterChipProps) {
  return (
    <button
      {...props}
      type="button"
      aria-pressed={active}
      className={`shrink-0 rounded-md px-2.5 py-1 text-[11px] transition-colors active:scale-[0.98] ${
        active
          ? "bg-panel-bg-inset font-semibold text-panel-text-0"
          : "bg-transparent font-medium text-panel-text-3 hover:bg-panel-bg-inset hover:text-panel-text-0"
      } ${className}`}
    />
  );
}
