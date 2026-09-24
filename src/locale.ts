import frData from "./data/talents.fr.json";
import type { EngineError, GameClass, Talent } from "./types";

export const LOCALES = ["fr", "en"] as const;
export type ContentLocale = (typeof LOCALES)[number];
export const LOCALE_KEY = "wowforever:locale";
export const DEFAULT_LOCALE: ContentLocale = "fr";

interface FrenchTalent {
  name: string;
  ranks: (string | null)[];
  cost: string | null;
  requirementText: string | null;
  classicText: string | null;
  classicTree: string | null;
  classicName: string | null;
}

interface FrenchClass {
  name: string;
  trees: { name: string; talents: Record<string, FrenchTalent> }[];
}

const french = frData.classes as unknown as Record<string, FrenchClass>;

export function parseLocale(value: string | null | undefined): ContentLocale {
  return value === "en" || value === "fr" ? value : DEFAULT_LOCALE;
}

export function readStoredLocale(storage: Storage | null | undefined): ContentLocale {
  if (!storage) return DEFAULT_LOCALE;
  try {
    return parseLocale(storage.getItem(LOCALE_KEY));
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function persistLocale(storage: Storage | null | undefined, locale: ContentLocale): void {
  if (!storage) return;
  try {
    storage.setItem(LOCALE_KEY, locale);
  } catch {
    /* quota / private mode */
  }
}

function frenchTalent(gameClass: GameClass, treeIndex: number, talent: Talent): FrenchTalent | null {
  return french[gameClass.id]?.trees[treeIndex]?.talents[`${talent.row}-${talent.col}`] ?? null;
}

export function classLabel(locale: ContentLocale, gameClass: GameClass): string {
  if (locale === "en") return gameClass.name;
  return french[gameClass.id]?.name ?? gameClass.name;
}

export function treeLabel(locale: ContentLocale, gameClass: GameClass, treeIndex: number): string {
  const tree = gameClass.trees[treeIndex];
  if (!tree) return "";
  if (locale === "en") return tree.name;
  return french[gameClass.id]?.trees[treeIndex]?.name ?? tree.name;
}

export function talentLabel(locale: ContentLocale, gameClass: GameClass, treeIndex: number, talent: Talent): string {
  if (locale === "en") return talent.name;
  return frenchTalent(gameClass, treeIndex, talent)?.name ?? talent.name;
}

export function rankLabel(
  locale: ContentLocale,
  gameClass: GameClass,
  treeIndex: number,
  talent: Talent,
  rank: number,
): string | null {
  const english = talent.ranks.find((entry) => entry.rank === rank)?.text ?? null;
  if (locale === "en") return english;
  const translated = frenchTalent(gameClass, treeIndex, talent)?.ranks[rank - 1];
  return translated || english;
}

export function costLabel(locale: ContentLocale, gameClass: GameClass, treeIndex: number, talent: Talent): string | null {
  if (locale === "en") return talent.cost;
  const translated = frenchTalent(gameClass, treeIndex, talent);
  return translated ? translated.cost : talent.cost;
}

export function requirementLabel(
  locale: ContentLocale,
  gameClass: GameClass,
  treeIndex: number,
  talent: Talent,
): string | null {
  if (locale === "en") return talent.requirementText;
  const translated = frenchTalent(gameClass, treeIndex, talent);
  return translated ? translated.requirementText : talent.requirementText;
}

export function classicTextLabel(
  locale: ContentLocale,
  gameClass: GameClass,
  treeIndex: number,
  talent: Talent,
): string | null {
  if (locale === "en") return talent.classic.text;
  const translated = frenchTalent(gameClass, treeIndex, talent)?.classicText;
  return translated || talent.classic.text;
}

export function classicTreeLabel(
  locale: ContentLocale,
  gameClass: GameClass,
  treeIndex: number,
  talent: Talent,
): string | null {
  if (locale === "en") return talent.classic.tree;
  return frenchTalent(gameClass, treeIndex, talent)?.classicTree ?? talent.classic.tree;
}

export function localizeError(locale: ContentLocale, gameClass: GameClass, error: EngineError): EngineError {
  if (locale === "en") return error;
  const params = error.params ? { ...error.params } : undefined;
  if (params?.treeId) {
    const treeIndex = gameClass.trees.findIndex((tree) => tree.id === params.treeId);
    if (treeIndex >= 0) params.treeName = treeLabel(locale, gameClass, treeIndex);
  }
  if (params?.talentId) {
    for (let treeIndex = 0; treeIndex < gameClass.trees.length; treeIndex += 1) {
      const talent = gameClass.trees[treeIndex].talents.find((item) => item.id === params.talentId);
      if (talent) {
        params.talentName = talentLabel(locale, gameClass, treeIndex, talent);
        break;
      }
    }
  }
  return {
    ...error,
    params,
    cause: error.cause ? localizeError(locale, gameClass, error.cause) : undefined,
  };
}
