import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { MediaType } from "../api/types";
import { detailsHref, watchHref } from "../app/routes";

/** Abre detalhes como modal sobre a página atual (state.background) e atalhos de play. */
export function useOpenTitle() {
  const navigate = useNavigate();
  const location = useLocation();
  const background = (location.state as { background?: unknown } | null)?.background ?? location;

  const openDetails = useCallback(
    (type: MediaType, id: number) => navigate(detailsHref(type, id), { state: { background } }),
    [navigate, background],
  );
  const play = useCallback((type: MediaType, id: number) => navigate(watchHref(type, id)), [navigate]);

  return { openDetails, play };
}
