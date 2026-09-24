import type { GameClass } from "../types";
import { copy } from "../copy";
import { classLabel, treeLabel } from "../locale";
import { useLocale } from "../locale-context";
import { classHref, iconSrc } from "../paths";

interface HowToProps {
  classes: GameClass[];
  onSelect: (classId: string) => void;
}

export function HowTo({ classes, onSelect }: HowToProps) {
  const locale = useLocale();
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

      <section className="content-section" id="classes">
        <p className="eyebrow">{copy.directory.eyebrow}</p>
        <h2>{copy.directory.title}</h2>
        <p className="section-intro">{copy.directory.intro}</p>
        <div className="class-directory">
          {classes.map((gameClass) => (
            <a
              key={gameClass.id}
              href={classHref(gameClass.id)}
              style={{ ["--class-color" as string]: gameClass.color }}
              onClick={(event) => {
                event.preventDefault();
                onSelect(gameClass.id);
              }}
            >
              <img src={iconSrc(gameClass.icon)} width={36} height={36} alt="" />
              <div>
                <strong>{classLabel(locale, gameClass)}</strong>
                <span>{gameClass.trees.map((_, index) => treeLabel(locale, gameClass, index)).join(" · ")}</span>
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
