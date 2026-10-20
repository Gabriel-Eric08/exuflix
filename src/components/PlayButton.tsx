import { Play } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { MediaType, Season } from "../api/types";
import { watchHref } from "../app/routes";

interface Props {
  type: MediaType;
  id: number;
  seasons?: Season[];
  variant?: "light" | "primary";
}

/** Botão principal "Assistir". */
export function PlayButton({ type, id, variant = "light" }: Props) {
  const navigate = useNavigate();
  return (
    <button className={`btn btn-${variant}`} onClick={() => navigate(watchHref(type, id))}>
      <Play size={20} fill="currentColor" /> Assistir
    </button>
  );
}
