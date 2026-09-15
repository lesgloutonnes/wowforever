interface IconProps {
  name:
    | "copy"
    | "save"
    | "reset"
    | "close"
    | "check"
    | "arrow"
    | "plus"
    | "minus"
    | "book"
    | "trash";
  size?: number;
}

const PATHS: Record<IconProps["name"], string> = {
  copy: "M8 8h11v12H8z M5 16H3V3h12v2",
  save: "M5 3h12l3 3v15H4V3z M8 3v6h8V3 M8 21v-8h8v8",
  reset: "M4 10a8 8 0 1 1 1 8 M4 4v6h6",
  close: "m6 6 12 12 M18 6 6 18",
  check: "m4 12 5 5L20 6",
  arrow: "M4 12h16 m-6-6 6 6-6 6",
  plus: "M12 5v14 M5 12h14",
  minus: "M5 12h14",
  book: "M12 5v16 M3 4c4-1 6 0 9 2 3-2 5-3 9-2v15c-4-1-6 0-9 2-3-2-5-3-9-2z",
  trash: "M4 6h16 M9 6V3h6v3 M6 6l1 15h10l1-15 M10 10v7 M14 10v7",
};

export function Icon({ name, size = 16 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={PATHS[name]} />
    </svg>
  );
}
