/**
 * Scenario vocabulary + ordering for the picker. Kept as a tiny constants
 * module so both server (validation) and client (filter chips) can import it
 * without pulling in the disk loader.
 *
 * Adding a new scenario: add the key + i18n dictionary entry. Skills whose
 * `frontmatter.scenario` field uses a key not listed below still load — they
 * just sort under a synthetic "other" bucket at the end and render with the
 * raw id as label.
 */

import type { DictKey } from "@/lib/i18n";

/** Canonical scenario keys we know how to translate. */
export const SCENARIO_KEYS = [
  "marketing",
  "engineering",
  "operations",
  "product",
  "design",
  "finance",
  "sales",
  "hr",
  "personal",
  "education",
  "creator",
  "video",
] as const;

export type ScenarioKey = (typeof SCENARIO_KEYS)[number];

const SCENARIO_DICT_KEY: Record<string, DictKey> = {
  marketing: "template.scenario.marketing",
  engineering: "template.scenario.engineering",
  operations: "template.scenario.operations",
  product: "template.scenario.product",
  design: "template.scenario.design",
  finance: "template.scenario.finance",
  sales: "template.scenario.sales",
  hr: "template.scenario.hr",
  personal: "template.scenario.personal",
  education: "template.scenario.education",
  creator: "template.scenario.creator",
  video: "template.scenario.video",
};

/**
 * Returns the dict key for a scenario id, or `null` if the scenario is
 * unknown (the picker renders the raw id as a fallback label).
 */
export function scenarioLabelKey(scenario: string): DictKey | null {
  return SCENARIO_DICT_KEY[scenario] ?? null;
}

export const SCENARIO_ORDER: string[] = [
  "marketing",
  "design",
  "product",
  "engineering",
  "operations",
  "creator",
  "finance",
  "education",
  "personal",
  "hr",
  "sales",
  "video",
];
