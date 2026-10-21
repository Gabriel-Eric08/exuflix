import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { MediaType } from "../api/types";
import { useHrefs } from "../catalog/CatalogContext";

/** Abre detalhes como modal sobre a página atual (state.background) e atalhos de play. */
export function useOpenTitle() {
  const navigate = useNavigate();
  const location = useLocation();
  const hrefs = useHrefs();
  const background = (location.state as { background?: unknown } | null)?.background ?? location;

  const openDetails = useCallback(
    (type: MediaType, id: number) => navigate(hrefs.details(type, id), { state: { background } }),
    [navigate, background, hrefs],
  );
  const play = useCallback((type: MediaType, id: number) => navigate(hrefs.watch(type, id)), [navigate, hrefs]);

  return { openDetails, play };
}
