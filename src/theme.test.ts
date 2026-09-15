import { describe, expect, it } from "vitest";
import { applyTheme, DEFAULT_THEME, parseTheme, persistTheme, readStoredTheme, THEME_COLORS, THEME_KEY } from "./theme";

describe("parseTheme", () => {
  it("accepte alliance et horde", () => {
    expect(parseTheme("alliance")).toBe("alliance");
    expect(parseTheme("horde")).toBe("horde");
  });

  it("retombe sur alliance par défaut", () => {
    expect(parseTheme(null)).toBe(DEFAULT_THEME);
    expect(parseTheme(undefined)).toBe("alliance");
    expect(parseTheme("night elf")).toBe("alliance");
    expect(parseTheme("")).toBe("alliance");
  });
});

describe("theme storage", () => {
  it("lit et écrit le thème choisi", () => {
    const store = new Map<string, string>();
    const storage = {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => {
        store.set(key, value);
      },
    } as Storage;

    expect(readStoredTheme(storage)).toBe("alliance");
    persistTheme(storage, "horde");
    expect(store.get(THEME_KEY)).toBe("horde");
    expect(readStoredTheme(storage)).toBe("horde");
  });

  it("reste alliance si le stockage est indisponible", () => {
    expect(readStoredTheme(null)).toBe("alliance");
    persistTheme(null, "horde");
  });
});

describe("applyTheme", () => {
  it("pose data-theme et met à jour theme-color", () => {
    const attrs: Record<string, string> = {};
    const meta = { content: "", setAttribute(name: string, value: string) {
      if (name === "content") this.content = value;
    } };
    const root = {
      setAttribute(name: string, value: string) {
        attrs[name] = value;
      },
      ownerDocument: {
        querySelector(selector: string) {
          return selector === 'meta[name="theme-color"]' ? meta : null;
        },
      },
    };
    applyTheme("horde", root as unknown as HTMLElement);
    expect(attrs["data-theme"]).toBe("horde");
    expect(meta.content).toBe(THEME_COLORS.horde);
  });
});
