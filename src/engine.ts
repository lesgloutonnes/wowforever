import type {
  EngineError,
  EngineResult,
  GameClass,
  RankText,
  Talent,
  TalentBuild,
  TalentTree,
} from "./types";

export const MIN_LEVEL = 10;
export const MAX_LEVEL = 60;

export function pointsBudget(level: number): number {
  return level - 9;
}

export function treeSpent(ranks: number[]): number {
  return ranks.reduce((sum, rank) => sum + rank, 0);
}

export function spentPoints(build: TalentBuild): number {
  return build.ranks.reduce((sum, ranks) => sum + treeSpent(ranks), 0);
}

export function requiredLevel(build: TalentBuild): number {
  return Math.max(MIN_LEVEL, spentPoints(build) + 9);
}

export function emptyBuild(gameClass: GameClass, level = MAX_LEVEL): TalentBuild {
  return {
    classId: gameClass.id,
    level,
    ranks: gameClass.trees.map((tree) => tree.talents.map(() => 0)),
  };
}

function fail(code: EngineError["code"], params?: EngineError["params"], cause?: EngineError): EngineResult<never> {
  return { ok: false, error: cause ? { code, params, cause } : { code, params } };
}

export function cloneBuild(build: TalentBuild): TalentBuild {
  return {
    classId: build.classId,
    level: build.level,
    ranks: build.ranks.map((tree) => [...tree]),
  };
}

export function gateForTalent(
  tree: TalentTree,
  ranks: number[],
  talent: Talent,
): EngineError | null {
  const needed = (talent.row - 1) * 5;
  const earlier = tree.talents.reduce(
    (sum, candidate, index) => sum + (candidate.row < talent.row ? ranks[index] : 0),
    0,
  );
  if (earlier < needed) {
    return {
      code: "requires-row-points",
      params: { needed, treeId: tree.id, treeName: tree.name },
    };
  }
  for (const prereqId of prerequisiteIds(talent)) {
    const prereqIndex = tree.talents.findIndex((item) => item.id === prereqId);
    const prereq = tree.talents[prereqIndex];
    if (!prereq) return { code: "missing-prerequisite" };
    if (ranks[prereqIndex] < prereq.maxRank) {
      return {
        code: "requires-prerequisite",
        params: {
          max: prereq.maxRank,
          talentId: prereq.id,
          talentName: prereq.name,
        },
      };
    }
  }
  return null;
}

export function validateBuild(build: TalentBuild | null | undefined, gameClass: GameClass): EngineResult<TalentBuild> {
  if (!build || typeof build !== "object") return fail("invalid-build");
  if (build.classId !== gameClass.id) return fail("wrong-class");
  if (!Number.isInteger(build.level) || build.level < MIN_LEVEL || build.level > MAX_LEVEL) {
    return fail("invalid-level");
  }
  if (!Array.isArray(build.ranks) || build.ranks.length !== gameClass.trees.length) {
    return fail("missing-trees");
  }

  for (let treeIndex = 0; treeIndex < gameClass.trees.length; treeIndex += 1) {
    const tree = gameClass.trees[treeIndex];
    const ranks = build.ranks[treeIndex];
    if (!Array.isArray(ranks) || ranks.length !== tree.talents.length) {
      return fail("tree-mismatch", { treeId: tree.id, treeName: tree.name });
    }
    for (let talentIndex = 0; talentIndex < ranks.length; talentIndex += 1) {
      const rank = ranks[talentIndex];
      const talent = tree.talents[talentIndex];
      if (!Number.isInteger(rank) || rank < 0 || rank > talent.maxRank) {
        return fail("invalid-rank", { talentId: talent.id, talentName: talent.name });
      }
    }
    for (let talentIndex = 0; talentIndex < ranks.length; talentIndex += 1) {
      if (ranks[talentIndex] === 0) continue;
      const gate = gateForTalent(tree, ranks, tree.talents[talentIndex]);
      if (gate) {
        return fail("talent-gate", {
          talentId: tree.talents[talentIndex].id,
          talentName: tree.talents[talentIndex].name,
        }, gate);
      }
    }
  }

  if (spentPoints(build) > pointsBudget(build.level)) {
    return fail("over-budget", { level: build.level, budget: pointsBudget(build.level) });
  }

  return { ok: true, value: cloneBuild(build) };
}

export function learnBlocker(
  build: TalentBuild,
  gameClass: GameClass,
  treeIndex: number,
  talentIndex: number,
): EngineError | null {
  const tree = gameClass.trees[treeIndex];
  const talent = tree?.talents[talentIndex];
  if (!talent || !build.ranks[treeIndex]) return { code: "unknown-talent" };
  if (build.ranks[treeIndex][talentIndex] >= talent.maxRank) return { code: "max-rank" };
  const gate = gateForTalent(tree, build.ranks[treeIndex], talent);
  if (gate) return gate;
  if (spentPoints(build) >= pointsBudget(build.level)) return { code: "no-points-left" };
  return null;
}

export function applyPoint(
  build: TalentBuild,
  gameClass: GameClass,
  treeIndex: number,
  talentIndex: number,
  delta: 1 | -1,
): EngineResult<TalentBuild> {
  const validated = validateBuild(build, gameClass);
  if (!validated.ok) return validated;
  const talent = gameClass.trees[treeIndex]?.talents[talentIndex];
  if (!talent) return fail("unknown-talent");

  if (delta === 1) {
    const blocker = learnBlocker(build, gameClass, treeIndex, talentIndex);
    if (blocker) return { ok: false, error: blocker };
  } else if (validated.value.ranks[treeIndex][talentIndex] <= 0) {
    return fail("no-points-to-refund");
  }

  const next = validated.value;
  next.ranks[treeIndex][talentIndex] += delta;
  const result = validateBuild(next, gameClass);
  if (!result.ok && delta === -1) return fail("refund-blocked", undefined, result.error);
  return result;
}

export function changeLevel(
  build: TalentBuild,
  gameClass: GameClass,
  level: number,
): EngineResult<TalentBuild> {
  return validateBuild({ ...build, level }, gameClass);
}

export function resetTree(
  build: TalentBuild,
  gameClass: GameClass,
  treeIndex: number,
): EngineResult<TalentBuild> {
  if (!gameClass.trees[treeIndex]) return fail("unknown-talent");
  return validateBuild({
    ...build,
    ranks: build.ranks.map((ranks, index) => (index === treeIndex ? ranks.map(() => 0) : [...ranks])),
  }, gameClass);
}

export function prerequisiteIds(talent: Talent): string[] {
  if (!talent.prerequisite) return [];
  return Array.isArray(talent.prerequisite) ? talent.prerequisite : [talent.prerequisite];
}

export function rankText(talent: Talent, rank: number): RankText | null {
  if (rank < 1) return null;
  return talent.ranks.find((entry) => entry.rank === rank) ?? null;
}

export function nearestRankText(talent: Talent, rank: number): RankText | null {
  const exact = rankText(talent, rank);
  if (exact) return exact;
  const earlier = talent.ranks.filter((entry) => entry.rank <= rank).sort((a, b) => b.rank - a.rank)[0];
  return earlier ?? talent.ranks[0] ?? null;
}
