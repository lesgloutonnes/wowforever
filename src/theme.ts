export const THEME_KEY = "wowforever:theme";
export const THEMES = ["alliance", "horde"] as const;
export type FactionTheme = (typeof THEMES)[number];
export const DEFAULT_THEME: FactionTheme = "alliance";

export const THEME_COLORS: Record<FactionTheme, string> = {
  alliance: "#0b1220",
  horde: "#160c0a",
};

export function parseTheme(value: string | null | undefined): FactionTheme {
  return value === "horde" || value === "alliance" ? value : DEFAULT_THEME;
}

export function readStoredTheme(storage: Storage | null | undefined): FactionTheme {
  if (!storage) return DEFAULT_THEME;
  try {
    return parseTheme(storage.getItem(THEME_KEY));
  } catch {
    return DEFAULT_THEME;
  }
}

export function persistTheme(storage: Storage | null | undefined, theme: FactionTheme): void {
  if (!storage) return;
  try {
    storage.setItem(THEME_KEY, theme);
  } catch {
    /* quota / private mode */
  }
}

export function applyTheme(theme: FactionTheme, root: HTMLElement = document.documentElement): void {
  root.setAttribute("data-theme", theme);
  const meta = root.ownerDocument.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", THEME_COLORS[theme]);
}

export const THEME_BOOTSTRAP = `(function(){var t="alliance";try{var s=localStorage.getItem("${THEME_KEY}");if(s==="horde"||s==="alliance")t=s;}catch(e){}document.documentElement.setAttribute("data-theme",t);})();`;
