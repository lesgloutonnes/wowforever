export type ClassicStatus = "new" | "changed" | "moved" | "same";

export type RankConfidence = "source" | "estimated";

export interface RankText {
  rank: number;
  text: string;
  confidence: RankConfidence;
}

export interface ClassicInfo {
  status: ClassicStatus;
  tree: string | null;
  row: number | null;
  col: number | null;
  max: number | null;
  text: string | null;
  renamed: string | null;
  moved: boolean;
}

export interface Talent {
  id: string;
  name: string;
  maxRank: number;
  row: number;
  col: number;
  icon: string;
  passive: boolean;
  prerequisite: string | string[] | null;
  requirementText: string | null;
  cost: string | null;
  note: string | null;
  ranks: RankText[];
  classic: ClassicInfo;
}

export interface TalentTree {
  id: string;
  name: string;
  icon: string;
  background: number;
  talents: Talent[];
}

export interface GameClass {
  id: string;
  name: string;
  icon: string;
  color: string;
  trees: TalentTree[];
}

export interface TalentDataset {
  version: string;
  dataVersion: string;
  attribution: string;
  classes: GameClass[];
}

export interface TalentBuild {
  classId: string;
  level: number;
  ranks: number[][];
}

export type ErrorCode =
  | "invalid-build"
  | "wrong-class"
  | "invalid-level"
  | "missing-trees"
  | "tree-mismatch"
  | "invalid-rank"
  | "talent-gate"
  | "over-budget"
  | "unknown-talent"
  | "max-rank"
  | "no-points-left"
  | "no-points-to-refund"
  | "refund-blocked"
  | "requires-row-points"
  | "requires-prerequisite"
  | "missing-prerequisite"
  | "link-too-long"
  | "link-damaged"
  | "unsupported-format"
  | "wrong-data-version"
  | "storage-unavailable"
  | "draft-write-failed"
  | "saved-list-damaged"
  | "saved-read-failed"
  | "save-failed"
  | "invalid-build-name";

export interface EngineError {
  code: ErrorCode;
  params?: Record<string, string | number>;
  cause?: EngineError;
}

export type EngineResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: EngineError };

export interface SavedBuild {
  id: string;
  name: string;
  classId: string;
  encoded: string;
  savedAt: string;
}

export interface Selection {
  treeIndex: number;
  talentIndex: number;
}
