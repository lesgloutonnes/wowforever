import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { applyTheme, readStoredTheme } from "./theme";
import "./index.css";

try {
  applyTheme(readStoredTheme(window.localStorage));
} catch {
  applyTheme("alliance");
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
