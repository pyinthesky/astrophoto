"use client";

import { useEffect, useState } from "react";
import { Moon, SunDim } from "lucide-react";

const storageKey = "astro-npf-theme";

export function ThemeToggle() {
  const [nightVision, setNightVision] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setNightVision(document.documentElement.dataset.theme === "night");
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  function toggleTheme() {
    const next = !nightVision;
    setNightVision(next);
    if (next) {
      document.documentElement.dataset.theme = "night";
      window.localStorage.setItem(storageKey, "night");
    } else {
      delete document.documentElement.dataset.theme;
      window.localStorage.removeItem(storageKey);
    }
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      aria-pressed={nightVision}
      aria-label={nightVision ? "Turn off night vision palette" : "Turn on OLED night vision palette"}
      title={nightVision ? "Return to standard palette" : "Use OLED black and dim red"}
      onClick={toggleTheme}
    >
      {nightVision ? <SunDim size={15} /> : <Moon size={15} />}
      <span>{nightVision ? "Standard" : "Night vision"}</span>
    </button>
  );
}
