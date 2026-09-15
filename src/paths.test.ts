import { describe, expect, it } from "vitest";
import { classHref, iconSrc, bgSrc } from "./paths";

describe("file-safe URLs", () => {
  it("selects a class with a query string instead of a server route", () => {
    expect(classHref("mage")).toBe("?c=mage");
  });

  it("loads media next to index.html for file://", () => {
    expect(iconSrc("class_warrior")).toBe("./public/icons/class_warrior.jpg");
    expect(bgSrc(161)).toBe("./public/bg/161.jpg");
  });
});
