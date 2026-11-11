import { RemixIcon } from "../../icons/RemixIcons";
import { useI18n } from "../../i18n/I18n";
import { RotateCcw } from "../../icons/SystemIcons";
import { useTrackDesignInput } from "../../contexts/DesignPanelInputContext";
import { Menu, MenuRadioGroup, MenuRadioItem } from "../ui/Menu";
import {
  VALUE_TIER_LABEL_CLASS,
  VALUE_TIER_VALUE_CLASS,
  type PropertyValueTier,
} from "./propertyPanelValueTier";

/* ------------------------------------------------------------------ */
/*  FlatSelectRow — label/value row with native or shared menu UI      */
/* ------------------------------------------------------------------ */

export function FlatSelectRow({
  label,
  ariaLabel,
  value,
  options,
  tier,
  disabled,
  onChange,
  onReset,
  presentation = "native",
}: {
  label: string;
  /** Accessible name when a caller renders the visible label OUTSIDE this
   *  row (label="" to avoid a duplicate) — e.g. Grade's "Preset" row, which
   *  shows its own label span and would otherwise leave the <select>
   *  unnamed. Falls back to `label` when omitted. */
  ariaLabel?: string;
  value: string;
  options: Array<string | { value: string; label: string }>;
  tier: PropertyValueTier;
  disabled?: boolean;
  onChange: (nextValue: string) => void;
  onReset?: () => void;
  presentation?: "native" | "menu";
}) {
  const { t } = useI18n();
  const track = useTrackDesignInput();
  const trackName = ariaLabel || label;
  const normalizedOptions = options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option,
  );
  const selectedOption = normalizedOptions.find((option) => option.value === value);
  // A valid authored value outside the preset list (e.g. a `mix-blend-mode`
  // or `object-position` this row doesn't offer as a preset) must not be
  // silently misrepresented as the first option — the native <select> falls
  // back to selectedIndex 0 when `value` matches no <option>, and reselecting
  // that visible-but-wrong preset overwrites the real persisted value. Prepend
  // the current value so it's always representable, matching legacy
  // `SelectField`'s same guard.
  const renderedOptions =
    value && !normalizedOptions.some((option) => option.value === value)
      ? [{ value, label: value }, ...normalizedOptions]
      : normalizedOptions;
  return (
    <div className="group flex min-h-[30px] items-center justify-between">
      <span className={`text-[11px] ${VALUE_TIER_LABEL_CLASS[tier]}`}>{t(label)}</span>
      <span className="flex items-center gap-2">
        {presentation === "menu" ? (
          <Menu
            align="end"
            aria-label={t(ariaLabel || label)}
            trigger={
              <button
                type="button"
                disabled={disabled}
                aria-label={t(ariaLabel || label)}
                className="flex min-w-0 items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <span className={`max-w-[200px] truncate font-mono text-[11px] ${VALUE_TIER_VALUE_CLASS[tier]}`}>
                  {selectedOption ? t(selectedOption.label) : value}
                </span>
                <RemixIcon name="arrow-down-s-line" size={14} className="shrink-0 text-panel-text-5" />
              </button>
            }
          >
            <MenuRadioGroup
              value={value}
              onValueChange={(next) => {
                if (next === value) return;
                track("select", trackName);
                onChange(next);
              }}
            >
              {renderedOptions.map((option) => (
                <MenuRadioItem key={option.value} value={option.value}>
                  {normalizedOptions.includes(option) ? t(option.label) : option.label}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </Menu>
        ) : <label
          className={`flex items-center gap-1.5 border-b pb-px ${
            tier === "explicitCustom"
              ? "border-panel-accent/30 group-hover:border-panel-accent/70"
              : "border-panel-border-input/50 group-hover:border-panel-border-input"
          }`}
        >
          <select
            value={value}
            disabled={disabled}
            aria-label={t(ariaLabel || label) || undefined}
            onChange={(e) => {
              track("select", trackName);
              onChange(e.target.value);
            }}
            className={`appearance-none bg-transparent text-right font-mono text-[11px] outline-hidden disabled:cursor-not-allowed ${VALUE_TIER_VALUE_CLASS[tier]}`}
          >
            {renderedOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {normalizedOptions.includes(option) ? t(option.label) : option.label}
              </option>
            ))}
          </select>
          <RemixIcon name="arrow-down-s-line" size={14} className="shrink-0 text-panel-text-5" />
        </label>}
        {tier === "explicitCustom" && onReset && (
          <button
            type="button"
            data-flat-select-reset="true"
            title={t("Remove and fall back to default")}
            disabled={disabled}
            onClick={() => {
              track("button", `Reset ${trackName}`);
              onReset();
            }}
            className="shrink-0 text-panel-text-3 opacity-0 transition-opacity hover:text-panel-text-1 group-hover:opacity-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            <RotateCcw size={11} />
          </button>
        )}
      </span>
    </div>
  );
}
