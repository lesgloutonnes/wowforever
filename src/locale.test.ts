import { describe, expect, it } from "vitest";
import dataset from "./data/talents.json";
import { classLabel, rankLabel, talentLabel, treeLabel } from "./locale";
import type { TalentDataset } from "./types";

const data = dataset as TalentDataset;
const warrior = data.classes[0];
const heroic = warrior.trees[0].talents[0];

describe("libellés français", () => {
  it("traduit la classe, l’arbre, le talent et ses rangs", () => {
    expect(classLabel("fr", warrior)).toBe("Guerrier");
    expect(treeLabel("fr", warrior, 0)).toBe("Armes");
    expect(talentLabel("fr", warrior, 0, heroic)).toBe("Frappe héroïque améliorée");
    expect(rankLabel("fr", warrior, 0, heroic, 2)).toBe(
      "Réduit le coût de votre technique Frappe héroïque de 2 points de rage.",
    );
  });

  it("conserve l’anglais quand la langue est EN", () => {
    expect(classLabel("en", warrior)).toBe("Warrior");
    expect(talentLabel("en", warrior, 0, heroic)).toBe("Improved Heroic Strike");
    expect(rankLabel("en", warrior, 0, heroic, 1)).toBe("Reduces the cost of your Heroic Strike ability by 1 Rage.");
  });
});
