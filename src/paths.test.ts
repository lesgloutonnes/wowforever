import { describe, expect, it } from "vitest";
import { classHref } from "./paths";

describe("file-safe URLs", () => {
  it("selects a class with a query string instead of a server route", () => {
    expect(classHref("mage")).toBe("?c=mage");
    expect(classHref("warrior")).toBe("?c=warrior");
  });
});
