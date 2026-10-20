import { useEffect, useRef } from "react";

export interface PlayerKeyHandlers {
  togglePlay: () => void;
  seekBy: (s: number) => void;
  seekToFraction: (f: number) => void;
  volumeBy: (d: number) => void;
  toggleMute: () => void;
  toggleFullscreen: () => void;
  toggleSubtitles: () => void;
  togglePip: () => void;
  escape: () => void;
  next?: () => void;
  skipIntro?: () => void;
  activity: () => void;
}

/** Atalhos de teclado do player (seção 8.3). */
export function usePlayerKeyboard(handlers: PlayerKeyHandlers) {
  const ref = useRef(handlers);
  ref.current = handlers;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement;
      if (el.closest("input, textarea, select, [contenteditable], [role='dialog'] [data-trap]")) return;
      const h = ref.current;
      const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      let handled = true;

      switch (key) {
        case " ":
        case "k":
          // Espaço em um botão focado deve clicar o botão, não pausar
          if (key === " " && el.tagName === "BUTTON") { handled = false; break; }
          h.togglePlay();
          break;
        case "ArrowLeft":
        case "j":
          h.seekBy(-10);
          break;
        case "ArrowRight":
        case "l":
          h.seekBy(10);
          break;
        case "ArrowUp":
          h.volumeBy(0.1);
          break;
        case "ArrowDown":
          h.volumeBy(-0.1);
          break;
        case "m":
          h.toggleMute();
          break;
        case "f":
          h.toggleFullscreen();
          break;
        case "c":
          h.toggleSubtitles();
          break;
        case "p":
          h.togglePip();
          break;
        case "n":
          if (h.next) h.next();
          else handled = false;
          break;
        case "s":
          if (h.skipIntro) h.skipIntro();
          else handled = false;
          break;
        case "Escape":
          h.escape();
          break;
        default:
          if (/^[0-9]$/.test(key)) h.seekToFraction(Number(key) / 10);
          else handled = false;
      }
      if (handled) {
        e.preventDefault();
        h.activity();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
