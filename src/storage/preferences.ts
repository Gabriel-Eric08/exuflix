import { useStored } from "./useStored";

export interface Prefs {
  volume: number; // 0–1
  muted: boolean;
  playbackRate: number;
  subtitleLang: string | null; // "pt-BR" | null (desligada)
  audioLang: string | null;
  autoplayNext: boolean;
  autoplayPreviews: boolean;
}

export const DEFAULT_PREFS: Prefs = {
  volume: 1,
  muted: false,
  playbackRate: 1,
  subtitleLang: null,
  audioLang: null,
  autoplayNext: true,
  autoplayPreviews: true,
};

export const usePreferences = () => {
  const [prefs, set] = useStored<Prefs>("prefs", DEFAULT_PREFS);
  // Mescla com os padrões para tolerar campos novos em schemas antigos
  return [{ ...DEFAULT_PREFS, ...prefs }, set] as const;
};
