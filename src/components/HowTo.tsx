import type { GameClass } from "../types";
import { copy } from "../copy";

interface HowToProps {
  classes: GameClass[];
  onSelect: (classId: string) => void;
}

export function HowTo({ classes, onSelect }: HowToProps) {
  return (
    <>
      <section className="content-section" id="guide">
        <p className="eyebrow">Guide</p>
        <h2>{copy.how.title}</h2>
        <p className="section-intro">{copy.how.intro}</p>
        <div className="guide-steps">
          {copy.how.steps.map((step) => (
            <article key={step.n}>
              <span className="step-number">{step.n}</span>
              <h3>{step.title}</h3>
              <p>{step.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section" id="faq">
        <div className="faq-section">
          <div>
            <p className="eyebrow">FAQ</p>
            <h2>{copy.faq.title}</h2>
            <p>{copy.faq.intro}</p>
          </div>
          <div className="faq-list">
            {copy.faq.items.map((item) => (
              <details key={item.q}>
                <summary>
                  {item.q}
                  <span>+</span>
                </summary>
                <p>{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="content-section" id="sources">
        <p className="eyebrow">Toutes les classes</p>
        <h2>Talents WoW Forever</h2>
        <p className="section-intro">
          Chaque classe conserve son propre brouillon. Revenez à votre répartition après avoir exploré une autre spécialisation.
        </p>
        <div className="class-directory">
          {classes.map((gameClass) => (
            <a
              key={gameClass.id}
              href={`/${gameClass.id}`}
              style={{ ["--class-color" as string]: gameClass.color }}
              onClick={(event) => {
                event.preventDefault();
                onSelect(gameClass.id);
              }}
            >
              <img src={`/icons/${gameClass.icon}.jpg`} width={36} height={36} alt="" />
              <div>
                <strong>{gameClass.name}</strong>
                <span>{gameClass.trees.map((tree) => tree.name).join(" · ")}</span>
              </div>
              <span className="directory-arrow">→</span>
            </a>
          ))}
        </div>
        <p className="reference-note" style={{ marginTop: 28 }}>
          {copy.footer.credit}
        </p>
        <p className="reference-note">{copy.footer.note}</p>
      </section>
    </>
  );
}
