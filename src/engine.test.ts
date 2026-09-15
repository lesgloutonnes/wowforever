import { describe, expect, it } from "vitest";
import type { GameClass } from "./types";
import {
  applyPoint,
  changeLevel,
  emptyBuild,
  gateForTalent,
  learnBlocker,
  pointsBudget,
  requiredLevel,
  resetTree,
  spentPoints,
  validateBuild,
} from "./engine";
import { decodeBuild, encodeBuild } from "./encode";

const fixture: GameClass = {
  id: "warrior",
  name: "Warrior",
  icon: "class_warrior",
  color: "#d8ad80",
  trees: [
    {
      id: "arms",
      name: "Arms",
      icon: "ability_rogue_eviscerate",
      background: 161,
      talents: [
        {
          id: "improved-heroic-strike",
          name: "Improved Heroic Strike",
          maxRank: 3,
          row: 1,
          col: 1,
          icon: "ability_rogue_ambush",
          passive: true,
          prerequisite: null,
          requirementText: null,
          cost: null,
          note: null,
          ranks: [{ rank: 1, text: "Rage -1", confidence: "source" }],
          classic: {
            status: "changed",
            tree: "Arms",
            row: 1,
            col: 1,
            max: 3,
            text: "old",
            renamed: null,
            moved: false,
          },
        },
        {
          id: "deflection",
          name: "Deflection",
          maxRank: 5,
          row: 1,
          col: 2,
          icon: "ability_parry",
          passive: true,
          prerequisite: null,
          requirementText: null,
          cost: null,
          note: null,
          ranks: [{ rank: 1, text: "Parry", confidence: "source" }],
          classic: {
            status: "same",
            tree: "Arms",
            row: 1,
            col: 2,
            max: 5,
            text: "Parry",
            renamed: null,
            moved: false,
          },
        },
        {
          id: "anger-management",
          name: "Anger Management",
          maxRank: 1,
          row: 2,
          col: 2,
          icon: "spell_holy_blessingofstamina",
          passive: true,
          prerequisite: "deflection",
          requirementText: null,
          cost: null,
          note: null,
          ranks: [{ rank: 1, text: "Rage regen", confidence: "source" }],
          classic: {
            status: "same",
            tree: "Arms",
            row: 2,
            col: 2,
            max: 1,
            text: "Rage regen",
            renamed: null,
            moved: false,
          },
        },
      ],
    },
    {
      id: "fury",
      name: "Fury",
      icon: "ability_warrior_innerrage",
      background: 164,
      talents: [
        {
          id: "cruelty",
          name: "Cruelty",
          maxRank: 5,
          row: 1,
          col: 2,
          icon: "ability_rogue_eviscerate",
          passive: true,
          prerequisite: null,
          requirementText: null,
          cost: null,
          note: null,
          ranks: [{ rank: 1, text: "Crit", confidence: "source" }],
          classic: {
            status: "same",
            tree: "Fury",
            row: 1,
            col: 2,
            max: 5,
            text: "Crit",
            renamed: null,
            moved: false,
          },
        },
      ],
    },
    {
      id: "protection",
      name: "Protection",
      icon: "ability_warrior_defensivestance",
      background: 163,
      talents: [
        {
          id: "shield-specialization",
          name: "Shield Specialization",
          maxRank: 5,
          row: 1,
          col: 2,
          icon: "inv_shield_06",
          passive: true,
          prerequisite: null,
          requirementText: null,
          cost: null,
          note: null,
          ranks: [{ rank: 1, text: "Block", confidence: "source" }],
          classic: {
            status: "same",
            tree: "Protection",
            row: 1,
            col: 2,
            max: 5,
            text: "Block",
            renamed: null,
            moved: false,
          },
        },
      ],
    },
  ],
};

describe("budget", () => {
  it("gives 51 points at level 60 and 21 at level 30", () => {
    expect(pointsBudget(60)).toBe(51);
    expect(pointsBudget(30)).toBe(21);
    expect(pointsBudget(10)).toBe(1);
  });
});

describe("allocation rules", () => {
  it("starts empty and can spend a first-row point", () => {
    const build = emptyBuild(fixture, 60);
    expect(spentPoints(build)).toBe(0);
    const next = applyPoint(build, fixture, 0, 0, 1);
    expect(next.ok).toBe(true);
    if (next.ok) expect(next.value.ranks[0][0]).toBe(1);
  });

  it("blocks a deep talent until the row has enough earlier points", () => {
    const build = emptyBuild(fixture, 60);
    const blocked = applyPoint(build, fixture, 0, 2, 1);
    expect(blocked.ok).toBe(false);
    if (!blocked.ok) expect(blocked.error.code).toBe("requires-row-points");
  });

  it("requires a maxed prerequisite before unlocking a dependent talent", () => {
    let build = emptyBuild(fixture, 60);
    for (let i = 0; i < 3; i += 1) {
      const step = applyPoint(build, fixture, 0, 0, 1);
      expect(step.ok).toBe(true);
      if (step.ok) build = step.value;
    }
    for (let i = 0; i < 2; i += 1) {
      const step = applyPoint(build, fixture, 0, 1, 1);
      expect(step.ok).toBe(true);
      if (step.ok) build = step.value;
    }
    const gated = learnBlocker(build, fixture, 0, 2);
    expect(gated?.code).toBe("requires-prerequisite");
    for (let i = 0; i < 3; i += 1) {
      const step = applyPoint(build, fixture, 0, 1, 1);
      expect(step.ok).toBe(true);
      if (step.ok) build = step.value;
    }
    const unlocked = applyPoint(build, fixture, 0, 2, 1);
    expect(unlocked.ok).toBe(true);
    const maxed = applyPoint(build, fixture, 0, 1, 1);
    expect(maxed.ok).toBe(false);
  });

  it("blocks refunds that would strand a later talent", () => {
    let build = emptyBuild(fixture, 60);
    for (let i = 0; i < 5; i += 1) {
      const step = applyPoint(build, fixture, 0, 1, 1);
      if (step.ok) build = step.value;
    }
    const learned = applyPoint(build, fixture, 0, 2, 1);
    expect(learned.ok).toBe(true);
    if (learned.ok) build = learned.value;
    const refund = applyPoint(build, fixture, 0, 1, -1);
    expect(refund.ok).toBe(false);
    if (!refund.ok) expect(refund.error.code).toBe("refund-blocked");
  });

  it("rejects a level drop below the spent budget", () => {
    let build = emptyBuild(fixture, 60);
    for (let i = 0; i < 5; i += 1) {
      const step = applyPoint(build, fixture, 1, 0, 1);
      if (step.ok) build = step.value;
    }
    expect(requiredLevel(build)).toBe(14);
    const tooLow = changeLevel(build, fixture, 12);
    expect(tooLow.ok).toBe(false);
    if (!tooLow.ok) expect(tooLow.error.code).toBe("over-budget");
  });

  it("resets a single tree", () => {
    let build = emptyBuild(fixture, 60);
    const spent = applyPoint(build, fixture, 1, 0, 1);
    if (spent.ok) build = spent.value;
    const reset = resetTree(build, fixture, 1);
    expect(reset.ok).toBe(true);
    if (reset.ok) expect(spentPoints(reset.value)).toBe(0);
  });

  it("exposes row gates through gateForTalent", () => {
    const build = emptyBuild(fixture, 60);
    const gate = gateForTalent(fixture.trees[0], build.ranks[0], fixture.trees[0].talents[2]);
    expect(gate?.code).toBe("requires-row-points");
  });
});

describe("share links", () => {
  it("round-trips a valid allocation", () => {
    let build = emptyBuild(fixture, 40);
    const learned = applyPoint(build, fixture, 0, 0, 1);
    expect(learned.ok).toBe(true);
    if (!learned.ok) return;
    build = learned.value;
    const encoded = encodeBuild(build);
    expect(encoded).toMatch(/^#b=1~2026-09-15~warrior~40~/);
    const decoded = decodeBuild(encoded, fixture);
    expect(decoded.ok).toBe(true);
    if (decoded.ok) expect(decoded.value).toEqual(build);
  });

  it("rejects a damaged hash", () => {
    expect(decodeBuild("#nope", fixture).ok).toBe(false);
  });

  it("rejects an illegal rank even if the hash parses", () => {
    const fake = validateBuild(
      { classId: "warrior", level: 60, ranks: [[9, 0, 0], [0], [0]] },
      fixture,
    );
    expect(fake.ok).toBe(false);
  });
});
