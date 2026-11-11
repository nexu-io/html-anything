import { RemixIcon } from "../../icons/RemixIcons";
// fallow-ignore-file unused-file
// (consumers land in the sidebar/panels PR later in this stack)
import { forwardRef, type InputHTMLAttributes } from "react";

interface SearchInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  /** Accessible name — placeholder alone is not one. */
  "aria-label": string;
}

/**
 * Shared search input — one visual system (soft panel background) for every
 * panel search box, with a required accessible name.
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(function SearchInput({ className = "", ...props }, ref) {
  return (
    <div
      className={`flex items-center gap-1.5 rounded-md bg-panel-bg-soft px-2.5 py-[5px] ${className}`}
    >
      <RemixIcon name="search-line" size={14} className="shrink-0 text-panel-text-5" />
      <input
        ref={ref}
        data-panel-search-input="true"
        type="text"
        className="min-w-0 w-full bg-transparent text-[11px] text-panel-text-1 outline-hidden placeholder:text-panel-text-5"
        {...props}
      />
    </div>
  );
});
