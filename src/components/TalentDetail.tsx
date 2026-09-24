import type { Talent, TalentTree } from "../types";
import { copy, fill } from "../copy";
import { nearestRankText, prerequisiteIds, rankText } from "../engine";
import { iconSrc } from "../paths";
import { Icon } from "./Icon";

interface TalentDetailProps {
  talent: Talent | null;
  tree: TalentTree | null;
  rank: number;
  compare: boolean;
  addError: string | null;
  removeError: string | null;
  onAdd: () => void;
  onRemove: () => void;
  onClose: () => void;
}

function RankDescription({ talent, rank }: { talent: Talent; rank: number }) {
  const exact = rankText(talent, rank);
  if (!exact) {
    const nearest = nearestRankText(talent, rank);
    return (
      <div className="rank-description">
        <span className="verification-tag">{fill(copy.detail.unverified, { rank })}</span>
        <p>{copy.detail.unverifiedBody}</p>
        {nearest && (
          <p className="reference-text">
            <strong>{fill(copy.detail.rankReference, { rank: nearest.rank })}</strong> {nearest.text}
          </p>
        )}
      </div>
    );
  }
  return (
    <div className="rank-description">
      {exact.confidence === "estimated" && <span className="verification-tag">{copy.detail.sourceEstimate}</span>}
      <p>{exact.text}</p>
    </div>
  );
}

export function TalentDetail({
  talent,
  tree,
  rank,
  compare,
  addError,
  removeError,
  onAdd,
  onRemove,
  onClose,
}: TalentDetailProps) {
  if (!talent || !tree) {
    return (
      <aside className="talent-detail empty-detail">
        <div className="detail-ornament">
          <Icon name="book" size={26} />
        </div>
        <p className="eyebrow">{copy.detail.emptyEyebrow}</p>
        <h3>{copy.detail.emptyTitle}</h3>
        <p>{copy.detail.emptyBody}</p>
        <div className="detail-key">
          <span>
            <kbd>{copy.detail.clickKey}</kbd> {copy.detail.clickLearn}
          </span>
          <span>
            <kbd>{copy.detail.rightKey}</kbd> {copy.detail.rightRefund}
          </span>
        </div>
        <span className="quiet-note">{copy.detail.touchHint}</span>
      </aside>
    );
  }

  const prereqs = prerequisiteIds(talent)
    .map((id) => tree.talents.find((item) => item.id === id))
    .filter((item): item is NonNullable<typeof item> => !!item);
  const shownRank = Math.max(1, rank);
  const statusLabel =
    talent.classic.status === "new"
      ? copy.calculator.legendNew
      : talent.classic.status === "changed"
        ? copy.calculator.legendChanged
        : talent.classic.status === "moved"
          ? copy.calculator.legendMoved
          : copy.detail.unchanged;

  return (
    <aside className="talent-detail has-selection" aria-label={copy.detail.selected}>
      <div className="sheet-handle" aria-hidden="true" />
      <div className="detail-heading">
        <img src={iconSrc(talent.icon)} width={44} height={44} alt="" />
        <div>
          <span className="eyebrow">
            {tree.name} · {talent.passive ? copy.detail.passive : copy.detail.active}
          </span>
          <h3>{talent.name}</h3>
        </div>
        <button type="button" className="icon-button sheet-close" aria-label={copy.detail.close} onClick={onClose}>
          <Icon name="close" />
        </button>
      </div>
      <div className="rank-track">
        <span>
          {copy.detail.rank} <strong>{rank}</strong> / {talent.maxRank}
        </span>
        <div className="rank-pips" aria-hidden="true">
          {Array.from({ length: talent.maxRank }, (_, index) => (
            <i key={index} className={index < rank ? "filled" : ""} />
          ))}
        </div>
      </div>
      {talent.cost && <p className="talent-cost">{talent.cost}</p>}
      {talent.requirementText && <p className="talent-cost">{talent.requirementText}</p>}
      <section className="rank-block">
        <h4>{rank ? copy.detail.currentRank : copy.detail.firstRank}</h4>
        <RankDescription talent={talent} rank={shownRank} />
      </section>
      {rank > 0 && rank < talent.maxRank && (
        <section className="rank-block next-rank">
          <h4>{fill(copy.detail.nextRank, { rank: rank + 1 })}</h4>
          <RankDescription talent={talent} rank={rank + 1} />
        </section>
      )}
      {talent.note && <p className="data-note">{fill(copy.detail.sourceNote, { note: talent.note })}</p>}
      {compare && (
        <section className="classic-detail">
          <h4>
            {copy.detail.classic}{" "}
            <span className={`change-label ${talent.classic.status}`}>
              {statusLabel}
              {talent.classic.moved && talent.classic.status !== "moved" ? ` · ${copy.detail.moved}` : ""}
            </span>
          </h4>
          {talent.classic.status === "new" ? (
            <p>{copy.detail.newTalent}</p>
          ) : (
            <>
              {talent.classic.text && <p>{talent.classic.text}</p>}
              <small>
                {fill(copy.detail.classicMeta, {
                  name: talent.classic.renamed ?? talent.name,
                  tree: talent.classic.tree ?? tree.name,
                  max: talent.classic.max ?? 0,
                })}
              </small>
              {talent.classic.moved && (
                <small>
                  {fill(copy.detail.movedFrom, {
                    fromTree: talent.classic.tree ?? "",
                    fromRow: talent.classic.row ?? 0,
                    fromCol: talent.classic.col ?? 0,
                    toTree: tree.name,
                    toRow: talent.row,
                    toCol: talent.col,
                  })}
                </small>
              )}
            </>
          )}
        </section>
      )}
      <div className="talent-requirements">
        <span>{fill(copy.detail.rowReq, { row: talent.row, needed: (talent.row - 1) * 5 })}</span>
        {prereqs.map((prereq) => (
          <span key={prereq.id}>{fill(copy.detail.requiresRanks, { max: prereq.maxRank, talent: prereq.name })}</span>
        ))}
      </div>
      <div className="detail-actions">
        <button type="button" className="button secondary" disabled={!!removeError} onClick={onRemove} title={removeError ?? copy.detail.refundTitle}>
          <Icon name="minus" /> {copy.detail.unlearn}
        </button>
        <button type="button" className="button primary" disabled={!!addError} onClick={onAdd} title={addError ?? copy.detail.learnTitle}>
          <Icon name="plus" /> {copy.detail.learn}
        </button>
      </div>
      {addError && <p className="requirement-message">{addError}</p>}
      {rank > 0 && removeError && <p className="requirement-message">{removeError}</p>}
    </aside>
  );
}
