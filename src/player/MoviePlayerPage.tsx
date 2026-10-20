import { useRef, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { RotateCcw } from "lucide-react";
import { img } from "../api/images";
import { useTitle } from "../hooks/queries";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { detailsHref, watchHref } from "../app/routes";
import { Artwork } from "../components/Artwork";
import { VideoPlayer } from "./VideoPlayer";
import { PlayerSkeleton } from "./PlayerBits";
import { resolveMovie, useRegistry } from "./sources";
import styles from "./Player.module.css";

export function useBack(fallback: string) {
  const navigate = useNavigate();
  return () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  };
}

export default function MoviePlayerPage() {
  const id = Number(useParams().id);
  const { data: title, isError } = useTitle("movie", id);
  const { data: source } = useQuery({ queryKey: ["src", "movie", id], queryFn: () => resolveMovie(id) });
  const { data: registry } = useRegistry();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ended, setEnded] = useState(false);
  const back = useBack(detailsHref("movie", id));
  const navigate = useNavigate();
  useDocumentTitle(title ? `Assistindo ${title.title}` : null);

  if (source === null) return <Navigate to={detailsHref("movie", id)} replace />;
  if (!source || (!title && !isError)) return <PlayerSkeleton />;

  const name = title?.title ?? "Filme";
  const recs = (title?.recommendations ?? []).filter(r => registry?.movies?.[r.id]).slice(0, 3);

  const replay = () => {
    setEnded(false);
    const v = videoRef.current;
    if (v) {
      v.currentTime = 0;
      v.play().catch(() => {});
    }
  };

  return (
    <div className={styles.page}>
      <VideoPlayer
        ref={videoRef}
        source={source}
        heading={name}
        mediaTitle={name}
        artwork={img(title?.poster, "w500")}
        poster={img(title?.backdrop, "w1280")}
        onBack={back}
        onEnded={() => setEnded(true)}
      >
        {() => (
          <>
            {source.attribution && <p className={styles.attribution}>{source.attribution}</p>}
            {ended && (
              <div className={styles.full} role="dialog" aria-label="Fim do filme">
                <h2>{name}</h2>
                <div className={styles.row}>
                  <button className="btn btn-light" onClick={replay} autoFocus>
                    <RotateCcw size={20} /> Assistir de novo
                  </button>
                  <button className="btn btn-ghost" onClick={back}>Voltar</button>
                </div>
                {recs.length > 0 && (
                  <>
                    <p style={{ color: "var(--text-2)", fontWeight: 700 }}>Também na Exuflix</p>
                    <div className={styles.recs}>
                      {recs.map(r => (
                        <button key={r.key} className={styles.rec} onClick={() => { setEnded(false); navigate(watchHref("movie", r.id), { replace: true }); }} aria-label={`Assistir ${r.title}`}>
                          <Artwork path={r.poster} kind="poster" title={r.title} sizes="180px" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </>
        )}
      </VideoPlayer>
    </div>
  );
}
