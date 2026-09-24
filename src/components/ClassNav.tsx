import type { GameClass } from "../types";
import { classLabel } from "../locale";
import { useLocale } from "../locale-context";
import { classHref, iconSrc } from "../paths";

interface ClassNavProps {
  classes: GameClass[];
  currentId: string;
  onSelect: (classId: string) => void;
}

export function ClassNav({ classes, currentId, onSelect }: ClassNavProps) {
  const locale = useLocale();
  return (
    <nav className="class-nav" aria-label="Choisir une classe">
      {classes.map((gameClass) => (
        <a
          key={gameClass.id}
          href={classHref(gameClass.id)}
          className={`class-link${gameClass.id === currentId ? " active" : ""}`}
          style={{ ["--class-color" as string]: gameClass.color }}
          onClick={(event) => {
            event.preventDefault();
            onSelect(gameClass.id);
          }}
        >
          <img src={iconSrc(gameClass.icon)} width={28} height={28} alt="" />
          <span>{classLabel(locale, gameClass)}</span>
        </a>
      ))}
    </nav>
  );
}
