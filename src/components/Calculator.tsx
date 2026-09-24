import { useEffect, useRef, useState } from "react";
import type { GameClass, SavedBuild, Selection, TalentBuild } from "../types";
import { copy, fill, formatError } from "../copy";
import {
  applyPoint,
  changeLevel,
  emptyBuild,
  learnBlocker,
  pointsBudget,
  requiredLevel,
  resetTree,
  spentPoints,
  treeSpent,
} from "../engine";
import { decodeBuild, encodeBuild } from "../encode";
import { classLabel, localizeError, talentLabel, treeLabel } from "../locale";
import { useLocale } from "../locale-context";
import { historyUrl, iconSrc, pageUrl } from "../paths";
import { deleteNamedBuild, readDraft, readSavedBuilds, saveNamedBuild, writeDraft } from "../storage";
import { Icon } from "./Icon";
import { TalentDetail } from "./TalentDetail";
import { TalentTreePanel } from "./TalentTree";

interface CalculatorProps {
  gameClass: GameClass;
}

export function Calculator({ gameClass }: CalculatorProps) {
  const locale = useLocale();
  const showError = (error: Parameters<typeof formatError>[0]) =>
    formatError(localizeError(locale, gameClass, error));
  const [build, setBuild] = useState<TalentBuild>(() => emptyBuild(gameClass));
  const [ready, setReady] = useState(false);
  const [compare, setCompare] = useState(false);
  const [activeTree, setActiveTree] = useState(0);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [status, setStatus] = useState({ text: copy.calculator.preparing, error: false });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [brokenLink, setBrokenLink] = useState("");
  const [storageOk, setStorageOk] = useState(true);
  const [saves, setSaves] = useState<SavedBuild[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [buildName, setBuildName] = useState("");
  const [copied, setCopied] = useState(false);
  const [canShare, setCanShare] = useState(false);

  const storageRef = useRef<Storage | null>(null);
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const shareInputRef = useRef<HTMLInputElement | null>(null);
  const lastTouchId = useRef<string | null>(null);
  const copyTimer = useRef<number>(0);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const announce = (text: string, error = false) => setStatus({ text, error });
  const editable = ready && !loadError;
  const spent = spentPoints(build);
  const left = pointsBudget(build.level) - spent;
  const shareUrl = pageUrl(gameClass.id, encodeBuild(build));

  useEffect(() => {
    setCanShare(typeof navigator.share === "function");
    let storage: Storage | null = null;
    try {
      storage = window.localStorage;
      storageRef.current = storage;
    } catch {
      setStorageOk(false);
    }

    const applyHash = (hash: string, shared: boolean) => {
      const decoded = decodeBuild(hash, gameClass);
      if (decoded.ok) {
        setBuild(decoded.value);
        setLoadError(null);
        announce(shared ? copy.calculator.sharedLoaded : copy.calculator.draftRestored);
      } else {
        setLoadError(showError(decoded.error));
        setBrokenLink(shared ? window.location.href : pageUrl(gameClass.id, hash));
        announce(copy.calculator.keptUnchanged, true);
      }
    };

    if (window.location.hash.startsWith("#b=")) {
      applyHash(window.location.hash, true);
    } else if (storage) {
      const draft = readDraft(storage, gameClass.id);
      if (draft.ok && draft.value) applyHash(draft.value, false);
      else if (draft.ok) announce(copy.calculator.begin);
      else {
        storageRef.current = null;
        setStorageOk(false);
        announce(showError(draft.error), true);
      }
    } else {
      announce(copy.calculator.storageUnavailable, true);
    }

    if (storage) {
      const listed = readSavedBuilds(storage);
      if (listed.ok) setSaves(listed.value);
      else announce(showError(listed.error), true);
    }

    setReady(true);
    const onHash = () => {
      if (window.location.hash.startsWith("#b=")) applyHash(window.location.hash, true);
    };
    window.addEventListener("hashchange", onHash);
    return () => {
      window.removeEventListener("hashchange", onHash);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
    };
  }, [gameClass]);

  useEffect(() => {
    if (!ready || loadError || !storageRef.current) return;
    const written = writeDraft(storageRef.current, gameClass.id, encodeBuild(build));
    if (written.ok) setStorageOk(true);
    else {
      setStorageOk(false);
      announce(showError(written.error), true);
    }
  }, [build, ready, loadError, gameClass.id]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (dialogOpen && !dialog.open) dialog.showModal();
    if (!dialogOpen && dialog.open) dialog.close();
  }, [dialogOpen]);

  function commit(result: ReturnType<typeof applyPoint>, message: string) {
    if (!result.ok) {
      announce(showError(result.error), true);
      return;
    }
    setBuild(result.value);
    setLoadError(null);
    window.history.replaceState(null, "", historyUrl(gameClass.id, encodeBuild(result.value)));
    announce(message);
  }

  function selectTalent(treeIndex: number, talentIndex: number) {
    setSelection((current) =>
      current?.treeIndex === treeIndex && current.talentIndex === talentIndex
        ? current
        : { treeIndex, talentIndex },
    );
  }

  function handlePoint(treeIndex: number, talentIndex: number, mode: "click" | "remove" | "touch") {
    if (!editable) return;
    selectTalent(treeIndex, talentIndex);
    const talent = gameClass.trees[treeIndex].talents[talentIndex];
    if (mode === "touch" && lastTouchId.current !== talent.id) {
      lastTouchId.current = talent.id;
      announce(copy.calculator.touchAgain);
      return;
    }
    lastTouchId.current = talent.id;
    commit(
      applyPoint(build, gameClass, treeIndex, talentIndex, mode === "remove" ? -1 : 1),
      fill(mode === "remove" ? copy.calculator.pointRefunded : copy.calculator.rankLearned, {
        talent: talentLabel(locale, gameClass, treeIndex, talent),
      }),
    );
  }

  async function copyLink() {
    if (!editable) return;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("clipboard");
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      announce(copy.calculator.copied);
      if (copyTimer.current) window.clearTimeout(copyTimer.current);
      copyTimer.current = window.setTimeout(() => setCopied(false), 2400);
    } catch {
      shareInputRef.current?.focus();
      shareInputRef.current?.select();
      announce(copy.calculator.copyManual);
    }
  }

  function persistNamed() {
    if (!storageRef.current) {
      announce(copy.calculator.saveUnavailable, true);
      return;
    }
    const named: SavedBuild = {
      id: crypto.randomUUID(),
      name: buildName.trim(),
      classId: gameClass.id,
      encoded: encodeBuild(build),
      savedAt: new Date().toISOString(),
    };
    const saved = saveNamedBuild(storageRef.current, named);
    if (saved.ok) {
      setSaves(saved.value);
      setBuildName("");
      announce(fill(copy.calculator.savedNamed, { name: named.name }));
    } else {
      announce(showError(saved.error), true);
    }
  }

  const selectedTree = selection ? gameClass.trees[selection.treeIndex] : null;
  const selectedTalent = selection && selectedTree ? selectedTree.talents[selection.talentIndex] : null;
  const selectedRank = selection ? build.ranks[selection.treeIndex][selection.talentIndex] : 0;
  const addBlock = selection ? learnBlocker(build, gameClass, selection.treeIndex, selection.talentIndex) : null;
  const removeResult = selection ? applyPoint(build, gameClass, selection.treeIndex, selection.talentIndex, -1) : null;
  const addError = editable ? (addBlock ? showError(addBlock) : null) : copy.calculator.editBlocked;
  const removeError = editable
    ? removeResult && !removeResult.ok
      ? showError(removeResult.error)
      : null
    : copy.calculator.editBlocked;
  const classSaves = saves.filter((item) => item.classId === gameClass.id);
  const ui = copy.calculator;

  return (
    <div className={`calculator${selection ? " sheet-open" : ""}`} id="calculator">
      <div className="planner-heading">
        <div className="current-class">
          <img src={iconSrc(gameClass.icon)} width={38} height={38} alt="" />
          <div>
            <span className="eyebrow">{ui.character}</span>
            <h2>{fill(ui.treesHeading, { class: classLabel(locale, gameClass) })}</h2>
          </div>
        </div>
        <div className="allocation-summary" aria-label={ui.pointsBySpec}>
          {gameClass.trees.map((tree, index) => (
            <span key={tree.id}>
              <strong>{treeSpent(build.ranks[index])}</strong>
              <small>{treeLabel(locale, gameClass, index)}</small>
            </span>
          ))}
        </div>
      </div>

      <div className="planner-toolbar">
        <label className="level-control">
          {ui.level}{" "}
          <select
            aria-label={ui.levelAria}
            value={build.level}
            disabled={!editable}
            onChange={(event) =>
              commit(
                changeLevel(build, gameClass, Number(event.target.value)),
                fill(ui.levelSet, { level: event.target.value }),
              )
            }
          >
            {Array.from({ length: 51 }, (_, index) => 60 - index).map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
        </label>
        <div className="points-counter">
          <strong>{left}</strong>
          <span>
            {left === 1 ? ui.pointsLeftOne : ui.pointsLeft}
            <small>{fill(ui.pointsOf, { budget: pointsBudget(build.level) })}</small>
          </span>
        </div>
        <span className="toolbar-divider" />
        <label className="compare-toggle">
          <input type="checkbox" checked={compare} onChange={(event) => setCompare(event.target.checked)} />
          <span className="switch" aria-hidden="true" />
          {ui.compare}
        </label>
        <div className="toolbar-actions">
          <button
            className="button quiet"
            type="button"
            disabled={!editable || spent === 0}
            onClick={() => commit({ ok: true, value: emptyBuild(gameClass, build.level) }, ui.resetAll)}
          >
            <Icon name="reset" />
            <span>{ui.reset}</span>
          </button>
          <button className="button secondary" type="button" disabled={!editable} onClick={() => setDialogOpen(true)}>
            <Icon name="save" />
            <span>{classSaves.length ? fill(ui.myBuildsCount, { count: classSaves.length }) : ui.myBuilds}</span>
          </button>
          <button className="button primary" type="button" disabled={!editable} onClick={copyLink}>
            <Icon name={copied ? "check" : "copy"} />
            <span>{copied ? ui.copiedShort : ui.copyBuild}</span>
          </button>
        </div>
      </div>

      <div className={`planner-status${status.error ? " error" : ""}`} role={status.error ? "alert" : "status"}>
        <span className="status-dot" />
        <span>{status.text}</span>
        <span className="minimum-level">
          {ui.requiredLevel} <strong>{requiredLevel(build)}</strong>
        </span>
      </div>

      {loadError && (
        <div className="load-error" role="alert">
          <h3>{ui.loadErrorTitle}</h3>
          <p>{loadError}</p>
          <input aria-label={ui.originalLink} value={brokenLink} readOnly onFocus={(event) => event.target.select()} />
          <button className="button secondary" type="button" onClick={() => commit({ ok: true, value: emptyBuild(gameClass) }, ui.fresh)}>
            {ui.startFresh}
          </button>
        </div>
      )}

      {compare && (
        <div className="comparison-legend">
          <span>
            <i className="new" />
            {ui.legendNew}
          </span>
          <span>
            <i className="changed" />
            {ui.legendChanged}
          </span>
          <span>
            <i className="moved" />
            {ui.legendMoved}
          </span>
          <span>
            <i className="same" />
            {ui.legendUnchanged}
          </span>
          <small>{ui.legendHint}</small>
        </div>
      )}

      <nav className="tree-tabs" aria-label={ui.treeTabs}>
        {gameClass.trees.map((tree, index) => (
          <button
            key={tree.id}
            type="button"
            ref={(node) => {
              tabRefs.current[index] = node;
            }}
            className={activeTree === index ? "active" : ""}
            aria-pressed={activeTree === index}
            onClick={() => {
              setActiveTree(index);
              setSelection(null);
              lastTouchId.current = null;
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
              event.preventDefault();
              const next = (index + (event.key === "ArrowRight" ? 1 : 2)) % 3;
              setActiveTree(next);
              setSelection(null);
              tabRefs.current[next]?.focus();
            }}
          >
            {treeLabel(locale, gameClass, index)}
            <span>{treeSpent(build.ranks[index])}</span>
          </button>
        ))}
      </nav>

      <div className="calculator-shell">
        <div className="tree-columns">
          {gameClass.trees.map((tree, index) => (
            <TalentTreePanel
              key={tree.id}
              tree={tree}
              treeIndex={index}
              gameClass={gameClass}
              build={build}
              selectedId={selectedTalent?.id ?? null}
              compare={compare}
              active={activeTree === index}
              ready={editable}
              onSelect={selectTalent}
              onPoint={handlePoint}
              onReset={(treeIndex) =>
                commit(resetTree(build, gameClass, treeIndex), fill(ui.resetTree, { tree: treeLabel(locale, gameClass, treeIndex) }))
              }
            />
          ))}
        </div>
        <TalentDetail
          talent={selectedTalent}
          tree={selectedTree}
          treeIndex={selection?.treeIndex ?? 0}
          gameClass={gameClass}
          rank={selectedRank}
          compare={compare}
          addError={addError}
          removeError={removeError}
          onAdd={() => selection && handlePoint(selection.treeIndex, selection.talentIndex, "click")}
          onRemove={() => selection && handlePoint(selection.treeIndex, selection.talentIndex, "remove")}
          onClose={() => {
            setSelection(null);
            lastTouchId.current = null;
          }}
        />
      </div>

      <div className="build-footer">
        <span>
          <i className={`save-dot${!storageOk || loadError ? " unavailable" : ""}`} />
          {loadError ? ui.originalKept : ready ? (storageOk ? ui.draftSaved : ui.storageShort) : ui.restoring}
        </span>
        <span>
          {ui.previewFooter} <a href="#classes">{ui.sourcesLink}</a>
        </span>
      </div>

      <section className="share-bar" aria-label={ui.shareBar}>
        <div>
          <span className="eyebrow">{ui.shareEyebrow}</span>
          <p>{ui.shareLead}</p>
        </div>
        <div className="share-input-wrap">
          <input
            ref={shareInputRef}
            aria-label={ui.shareInput}
            value={loadError ? brokenLink : shareUrl}
            readOnly
            onFocus={(event) => event.target.select()}
          />
          <button className="button secondary" disabled={!editable} type="button" onClick={copyLink}>
            <Icon name={copied ? "check" : "copy"} />
            <span>{ui.copyLink}</span>
          </button>
          {canShare && (
            <button
              className="button quiet"
              disabled={!editable}
              type="button"
              onClick={async () => {
                try {
                  await navigator.share({ title: fill(ui.shareTitle, { class: classLabel(locale, gameClass) }), url: shareUrl });
                } catch (error) {
                  if (!(error instanceof DOMException && error.name === "AbortError")) announce(ui.shareFailed);
                }
              }}
            >
              {ui.share}
            </button>
          )}
        </div>
      </section>

      <dialog
        ref={dialogRef}
        className="build-dialog"
        onCancel={() => setDialogOpen(false)}
        onClose={() => setDialogOpen(false)}
      >
        <div className="dialog-heading">
          <div>
            <span className="eyebrow">{ui.dialogEyebrow}</span>
            <h2>{fill(ui.dialogTitle, { class: classLabel(locale, gameClass) })}</h2>
          </div>
          <button className="icon-button" type="button" aria-label={ui.closeSaves} onClick={() => setDialogOpen(false)}>
            <Icon name="close" />
          </button>
        </div>
        <p className="dialog-intro">{ui.dialogIntro}</p>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            persistNamed();
          }}
        >
          <label htmlFor="build-name">{ui.buildName}</label>
          <div className="save-form">
            <input
              id="build-name"
              value={buildName}
              onChange={(event) => setBuildName(event.target.value)}
              placeholder={fill(ui.namePlaceholder, { class: classLabel(locale, gameClass) })}
              maxLength={80}
              required
            />
            <button className="button primary" type="submit">
              <Icon name="save" />
              {ui.saveBuild}
            </button>
          </div>
        </form>
        <p className={`dialog-feedback${status.error ? " error" : ""}`} role="status">
          {status.text}
        </p>
        <div className="saved-build-list">
          {classSaves.length === 0 ? (
            <p className="empty-saves">{ui.emptySaves}</p>
          ) : (
            classSaves.map((item) => (
              <div className="saved-build" key={item.id}>
                <div>
                  <strong>{item.name}</strong>
                  <small>{new Date(item.savedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</small>
                </div>
                <button
                  className="button secondary"
                  type="button"
                  onClick={() => {
                    const decoded = decodeBuild(item.encoded, gameClass);
                    commit(decoded, fill(ui.loadedNamed, { name: item.name }));
                    if (decoded.ok) setDialogOpen(false);
                  }}
                >
                  {ui.load}
                </button>
                <button
                  className="icon-button"
                  type="button"
                  aria-label={fill(ui.deleteNamed, { name: item.name })}
                  onClick={() => {
                    if (!storageRef.current) return;
                    const next = deleteNamedBuild(storageRef.current, item.id);
                    if (next.ok) {
                      setSaves(next.value);
                      announce(fill(ui.deletedNamed, { name: item.name }));
                    } else {
                      announce(showError(next.error), true);
                    }
                  }}
                >
                  <Icon name="trash" />
                </button>
              </div>
            ))
          )}
        </div>
      </dialog>
    </div>
  );
}
