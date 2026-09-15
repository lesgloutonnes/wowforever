import type { EngineResult, GameClass, TalentBuild } from "./types";
import { validateBuild } from "./engine";

export const DATA_VERSION = "2026-09-15";
const HASH_LIMIT = 600;

export function encodeBuild(build: TalentBuild, dataVersion = DATA_VERSION): string {
  const ranks = build.ranks.map((tree) => tree.join("")).join("-");
  const level = String(build.level).padStart(2, "0");
  return `#b=1~${dataVersion}~${build.classId}~${level}~${ranks}`;
}

export function decodeBuild(
  hash: string,
  gameClass: GameClass,
  dataVersion = DATA_VERSION,
): EngineResult<TalentBuild> {
  if (typeof hash !== "string" || hash.length > HASH_LIMIT) {
    return { ok: false, error: { code: "link-too-long" } };
  }
  const match = /^#b=(\d+)~([a-z0-9-]+)~([a-z]+)~(\d{2})~([0-9]+-[0-9]+-[0-9]+)$/.exec(hash);
  if (!match) return { ok: false, error: { code: "link-damaged" } };
  if (match[1] !== "1") return { ok: false, error: { code: "unsupported-format" } };
  if (match[2] !== dataVersion) return { ok: false, error: { code: "wrong-data-version" } };
  return validateBuild(
    {
      classId: match[3],
      level: Number(match[4]),
      ranks: match[5].split("-").map((chunk) => [...chunk].map(Number)),
    },
    gameClass,
  );
}
