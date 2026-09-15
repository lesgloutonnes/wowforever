import type { EngineResult, ErrorCode, SavedBuild } from "./types";

const SAVES_KEY = "wowforever:saved-builds:v1";
const draftKey = (classId: string) => `wowforever:draft:v1:${classId}`;

function wrapError(code: ErrorCode): EngineResult<never> {
  return { ok: false, error: { code } };
}

export function readDraft(storage: Storage, classId: string): EngineResult<string | null> {
  try {
    return { ok: true, value: storage.getItem(draftKey(classId)) };
  } catch {
    return wrapError("storage-unavailable");
  }
}

export function writeDraft(storage: Storage, classId: string, encoded: string): EngineResult<null> {
  try {
    storage.setItem(draftKey(classId), encoded);
    return { ok: true, value: null };
  } catch {
    return wrapError("draft-write-failed");
  }
}

export function readSavedBuilds(storage: Storage): EngineResult<SavedBuild[]> {
  try {
    const raw = storage.getItem(SAVES_KEY);
    if (raw === null) return { ok: true, value: [] };
    const parsed = JSON.parse(raw) as unknown;
    if (
      !Array.isArray(parsed) ||
      parsed.some(
        (item) =>
          !item ||
          typeof item !== "object" ||
          ["id", "name", "classId", "encoded", "savedAt"].some(
            (key) => typeof (item as Record<string, unknown>)[key] !== "string",
          ),
      )
    ) {
      return wrapError("saved-list-damaged");
    }
    return { ok: true, value: parsed as SavedBuild[] };
  } catch {
    return wrapError("saved-read-failed");
  }
}

function writeSavedBuilds(storage: Storage, builds: SavedBuild[]): EngineResult<SavedBuild[]> {
  try {
    storage.setItem(SAVES_KEY, JSON.stringify(builds));
    return { ok: true, value: builds };
  } catch {
    return wrapError("save-failed");
  }
}

export function saveNamedBuild(storage: Storage, build: SavedBuild): EngineResult<SavedBuild[]> {
  const current = readSavedBuilds(storage);
  if (!current.ok) return current;
  const name = build.name.trim();
  if (!name || name.length > 80) return wrapError("invalid-build-name");
  return writeSavedBuilds(storage, [...current.value, { ...build, name }]);
}

export function deleteNamedBuild(storage: Storage, id: string): EngineResult<SavedBuild[]> {
  const current = readSavedBuilds(storage);
  if (!current.ok) return current;
  return writeSavedBuilds(storage, current.value.filter((item) => item.id !== id));
}
