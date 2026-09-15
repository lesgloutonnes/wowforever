import type { GameClass } from "../types";
import { copy } from "../copy";
import { classHref } from "../paths";
import { ThemeSwitch } from "./ThemeSwitch";

interface HeaderProps {
  currentClass: GameClass;
}

export function Header({ currentClass }: HeaderProps) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="wordmark" href={classHref(currentClass.id)}>
          {copy.header.brand}
          <span className="wordmark-sub">{copy.header.brandSub}</span>
        </a>
        <nav>
          <a href="#calculator" className="current">
            {copy.header.calc}
          </a>
          <a href="#guide">{copy.header.how}</a>
          <a href="#classes">{copy.header.classes}</a>
        </nav>
        <ThemeSwitch />
      </div>
    </header>
  );
}
