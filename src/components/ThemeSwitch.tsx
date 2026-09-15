import { useEffect, useState } from "react";
import { copy } from "../copy";
import {
  applyTheme,
  persistTheme,
  parseTheme,
  THEMES,
  type FactionTheme,
} from "../theme";

export function ThemeSwitch() {
  const [theme, setTheme] = useState<FactionTheme>(() =>
    typeof document === "undefined" ? "alliance" : parseTheme(document.documentElement.getAttribute("data-theme")),
  );

  useEffect(() => {
    applyTheme(theme);
    try {
      persistTheme(window.localStorage, theme);
    } catch {
      /* private mode */
    }
  }, [theme]);

  return (
    <div className="theme-switch" role="radiogroup" aria-label={copy.header.theme}>
      {THEMES.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={theme === id}
          className={theme === id ? "active" : undefined}
          onClick={() => setTheme(id)}
        >
          {copy.header[id]}
        </button>
      ))}
    </div>
  );
}
