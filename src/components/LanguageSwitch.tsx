import { copy } from "../copy";
import { LOCALES } from "../locale";
import { useLocale, useSetLocale } from "../locale-context";

export function LanguageSwitch() {
  const locale = useLocale();
  const setLocale = useSetLocale();

  return (
    <div className="theme-switch language-switch" role="radiogroup" aria-label={copy.header.language}>
      {LOCALES.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={locale === id}
          className={locale === id ? "active" : undefined}
          onClick={() => setLocale(id)}
        >
          {copy.header.languages[id]}
        </button>
      ))}
    </div>
  );
}
