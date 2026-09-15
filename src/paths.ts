import type { GameClass } from "./types";

export function iconSrc(icon: string): string {
  return `./public/icons/${icon}.jpg`;
}

export function bgSrc(id: number): string {
  return `./public/bg/${id}.jpg`;
}

export function classHref(classId: string): string {
  return `?c=${classId}`;
}

export function documentFileUrl(): string {
  return window.location.href.split("#")[0].split("?")[0];
}

export function historyUrl(classId: string, hash = ""): string {
  return `?c=${classId}${hash}`;
}

export function pageUrl(classId: string, hash = ""): string {
  return `${documentFileUrl()}?c=${classId}${hash}`;
}

export function classFromLocation(classes: GameClass[]): GameClass {
  const hash = window.location.hash;
  if (hash.startsWith("#b=")) {
    const classId = hash.split("~")[2];
    const fromHash = classes.find((item) => item.id === classId);
    if (fromHash) return fromHash;
  }
  const classId = new URLSearchParams(window.location.search).get("c");
  return classes.find((item) => item.id === classId) ?? classes[0];
}
