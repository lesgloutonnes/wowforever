import { useRef } from "react";
import type { GameClass, TalentBuild, TalentTree } from "../types";
import { copy, fill, formatError } from "../copy";
import { applyPoint, learnBlocker, prerequisiteIds, treeSpent } from "../engine";
import { bgSrc, iconSrc } from "../paths";
import { Icon } from "./Icon";

interface TalentTreePanelProps {
  tree: TalentTree;
  treeIndex: number;
  gameClass: GameClass;
  build: TalentBuild;
  selectedId: string | null;
  compare: boolean;
  active: boolean;
  ready: boolean;
  onSelect: (treeIndex: number, talentIndex: number) => void;
  onPoint: (treeIndex: number, talentIndex: number, mode: "click" | "remove" | "touch") => void;
  onReset: (treeIndex: number) => void;
}

export function TalentTreePanel({
  tree,
  treeIndex,
  gameClass,
  build,
  selectedId,
  compare,
  active,
  ready,
  onSelect,
  onPoint,
  onReset,
}: TalentTreePanelProps) {
  const pointerKind = useRef<"mouse" | "touch" | "pen">("mouse");
  const ranks = build.ranks[treeIndex];
  const spent = treeSpent(ranks);

  return (
    <section className={`tree-panel${active ? " active-tree" : ""}`} aria-label={fill(copy.tree.aria, { tree: tree.name })}>
      <header className="tree-header">
        <img src={iconSrc(tree.icon)} width={25} height={25} alt="" />
        <h3>{tree.name}</h3>
        <span className="tree-point-count">
          {spent}
          <small> / 51</small>
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label={fill(copy.tree.reset, { tree: tree.name })}
          disabled={!ready || spent === 0}
          onClick={() => onReset(treeIndex)}
        >
          <Icon name="reset" size={15} />
        </button>
      </header>
      <div className="tree-canvas" style={{ ["--tree-art" as string]: `url('${bgSrc(tree.background)}')` }}>
        <svg className="talent-arrows" viewBox="0 0 400 602" preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <marker id={`arrow-${tree.id}`} markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
              <path d="M0,0 L6,3 L0,6" fill="context-stroke" />
            </marker>
          </defs>
          {tree.talents.flatMap((talent) =>
            prerequisiteIds(talent).flatMap((prereqId) => {
              const prereqIndex = tree.talents.findIndex((item) => item.id === prereqId);
              const prereq = tree.talents[prereqIndex];
              if (!prereq) return [];
              const x1 = (prereq.col - 0.5) * 100;
              const y1 = (prereq.row - 1) * 86 + 60;
              const x2 = (talent.col - 0.5) * 100;
              const y2 = (talent.row - 1) * 86 + 5;
              const mid = (y1 + y2) / 2;
              return [
                <path
                  key={`${talent.id}-${prereq.id}`}
                  d={`M${x1},${y1} V${mid} H${x2} V${y2}`}
                  className={ranks[prereqIndex] === prereq.maxRank ? "unlocked" : ""}
                  markerEnd={`url(#arrow-${tree.id})`}
                />,
              ];
            }),
          )}
        </svg>
        <div className="talent-grid">
          {tree.talents.map((talent, talentIndex) => {
            const rank = ranks[talentIndex];
            const blocker = learnBlocker(build, gameClass, treeIndex, talentIndex);
            const refund = applyPoint(build, gameClass, treeIndex, talentIndex, -1);
            const state = rank >= talent.maxRank ? "maxed" : rank > 0 ? "learned" : blocker ? "locked" : "available";
            const classicStatus = talent.classic.status;
            return (
              <div
                key={talent.id}
                className={`talent-slot ${state}${selectedId === talent.id ? " selected" : ""}${compare ? ` compare-${classicStatus}` : ""}`}
                style={{ gridRow: talent.row, gridColumn: talent.col }}
              >
                <button
                  type="button"
                  className="talent-node"
                  disabled={!ready}
                  aria-label={fill(copy.tree.node, { talent: talent.name, rank, max: talent.maxRank })}
                  aria-pressed={selectedId === talent.id}
                  title={
                    blocker && rank === 0
                      ? formatError(blocker)
                      : !refund.ok && rank > 0
                        ? formatError(refund.error)
                        : talent.name
                  }
                  onPointerDown={(event) => {
                    pointerKind.current = event.pointerType === "mouse" ? "mouse" : event.pointerType === "pen" ? "pen" : "touch";
                  }}
                  onPointerEnter={(event) => {
                    if (event.pointerType === "mouse") onSelect(treeIndex, talentIndex);
                  }}
                  onFocus={() => onSelect(treeIndex, talentIndex)}
                  onClick={(event) => {
                    const mode = event.shiftKey
                      ? "remove"
                      : event.detail !== 0 && pointerKind.current !== "mouse"
                        ? "touch"
                        : "click";
                    onPoint(treeIndex, talentIndex, mode);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    onPoint(treeIndex, talentIndex, "remove");
                  }}
                >
                  <img src={iconSrc(talent.icon)} alt="" width={48} height={48} draggable={false} />
                  <span className="node-rank">
                    {rank}
                    <i>/</i>
                    {talent.maxRank}
                  </span>
                  {compare && classicStatus !== "same" && (
                    <span className={`node-change ${classicStatus}`} aria-label={fill(copy.tree.change, { status: classicStatus })}>
                      {classicStatus === "new" ? "+" : classicStatus === "moved" ? "↗" : "•"}
                    </span>
                  )}
                  {compare && talent.classic.moved && classicStatus !== "moved" && (
                    <span className="node-change moved additional-change" aria-label={copy.tree.alsoMoved}>
                      ↗
                    </span>
                  )}
                </button>
                <span className="talent-name">{talent.name}</span>
              </div>
            );
          })}
        </div>
      </div>
      <footer className="tree-footer">
        <span className="tree-progress">
          <i style={{ width: `${(spent / 51) * 100}%` }} />
        </span>
        <span>
          {spent === 0
            ? copy.tree.story
            : fill(spent === 1 ? copy.tree.investedOne : copy.tree.investedMany, { points: spent })}
        </span>
      </footer>
    </section>
  );
}
