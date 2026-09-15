import { useEffect, useMemo, useState } from "react";
import dataset from "./data/talents.json";
import type { GameClass, TalentDataset } from "./types";
import { copy } from "./copy";
import { classFromLocation, classHref } from "./paths";
import { Header } from "./components/Header";
import { ClassNav } from "./components/ClassNav";
import { Calculator } from "./components/Calculator";
import { HowTo } from "./components/HowTo";

const talentData = dataset as TalentDataset;

export default function App() {
  const classes = talentData.classes;
  const [current, setCurrent] = useState<GameClass>(() =>
    typeof window === "undefined" ? classes[0] : classFromLocation(classes),
  );

  const currentClass = useMemo(
    () => classes.find((item) => item.id === current.id) ?? classes[0],
    [classes, current.id],
  );

  useEffect(() => {
    const sync = () => setCurrent(classFromLocation(classes));
    window.addEventListener("popstate", sync);
    window.addEventListener("hashchange", sync);
    return () => {
      window.removeEventListener("popstate", sync);
      window.removeEventListener("hashchange", sync);
    };
  }, [classes]);

  function selectClass(classId: string) {
    const next = classes.find((item) => item.id === classId);
    if (!next) return;
    window.history.pushState(null, "", classHref(next.id));
    setCurrent(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="app" style={{ ["--class-color" as string]: currentClass.color }}>
      <a className="skip-link" href="#calculator">
        Aller au calculateur
      </a>
      <Header currentClass={currentClass} />
      <main id="main">
        <div className="page-container">
          <section className="planner-hero">
            <div className="hero-label">
              <span /> {copy.hero.label} <span />
            </div>
            <h1>
              {copy.hero.titleBefore} <em>{copy.hero.titleEm}</em>
            </h1>
            <p>{copy.hero.body}</p>
            <div className="hero-meta">
              {copy.hero.meta.map((item, index) => (
                <span key={item}>
                  {index > 0 && <i />}
                  {item}
                </span>
              ))}
            </div>
          </section>
          <ClassNav classes={classes} currentId={currentClass.id} onSelect={selectClass} />
          <Calculator key={currentClass.id} gameClass={currentClass} />
          <HowTo classes={classes} onSelect={selectClass} />
        </div>
      </main>
      <footer className="site-footer">
        <div>
          <div className="footer-brand">{copy.siteName}</div>
          <p>{copy.footer.tagline}</p>
        </div>
        <div className="footer-links">
          <a href="#guide">{copy.header.how}</a>
          <a href="#faq">FAQ</a>
          <a href="#classes">{copy.header.classes}</a>
        </div>
        <p className="preview-credit">{copy.footer.credit}</p>
      </footer>
    </div>
  );
}
