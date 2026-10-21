import { useCallback, useEffect } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronDown, ChevronUp } from "lucide-react";
import { liveHref, XT_BASE } from "../app/routes";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { isMixedContent, liveUrl } from "../xtream/client";
import { useXtreamAccount } from "../xtream/credentials";
import { nowNext } from "../xtream/normalize";
import { useXtEpg, useXtLive } from "../xtream/queries";
import type { LiveChannel } from "../xtream/types";
import { RECENT_LIVE_KEY, formatClock, neighbors } from "../xtream/live";
import { update } from "../storage/store";

import { useBack } from "./MoviePlayerPage";
import { PlayerSkeleton } from "./PlayerSkeleton";
import { StreamFallback, fallbackReason } from "./StreamFallback";
import { VideoPlayer } from "./VideoPlayer";
import { ExternalOnly } from "./XtPlayerPages";
import styles from "./Player.module.css";

export default function LivePlayerPage() {
  const id = Number(useParams().id);
  const navigate = useNavigate();
  const acc = useXtreamAccount();
  const { data: channels, isError } = useXtLive();
  const channel = channels?.find(c => c.id === id);
  const { data: epg } = useXtEpg(id, !!channel);
  const back = useBack(`${XT_BASE}/ao-vivo`);
  useDocumentTitle(channel ? `${channel.name} · Ao vivo` : null);

  const { prev, next } = channel && channels ? neighbors(channels, channel) : { prev: null, next: null };
  const zap = useCallback((c: LiveChannel | null) => c && navigate(liveHref(c.id), { replace: true }), [navigate]);

  // Canal aberto vai para "Assistidos recentemente"
  useEffect(() => {
    if (channel) update<number[]>(RECENT_LIVE_KEY, [], list => [channel.id, ...list.filter(x => x !== channel.id)].slice(0, 20));
  }, [channel?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // PageUp/PageDown (e as teclas de canal do controle remoto) trocam de canal
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "PageUp" || e.key === "ChannelUp") zap(prev);
      else if (e.key === "PageDown" || e.key === "ChannelDown") zap(next);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prev, next, zap]);

  if (!acc) return <Navigate to="/" replace />;
  if (isError) return <Navigate to={`${XT_BASE}/ao-vivo`} replace />;
  if (!channels) return <PlayerSkeleton />;
  if (!channel) return <Navigate to={`${XT_BASE}/ao-vivo`} replace />;

  // Sem HLS liberado na conta, o navegador não toca .ts puro
  const hls = acc.formats.length === 0 || acc.formats.includes("m3u8");
  const url = liveUrl(acc, id, hls ? "m3u8" : "ts");
  const { now, next: upNext } = nowNext(epg ?? []);
  const info = (
    <span className={styles.channelInfo}>
      <strong>{channel.name}</strong>
      {now && (
        <span>
          Agora: {now.title} <span className="tabular">({formatClock(now.start)}–{formatClock(now.end)})</span>
          {upNext && <> · A seguir: {upNext.title}</>}
        </span>
      )}
    </span>
  );

  if (isMixedContent(url) || !hls) {
    return (
      <ExternalOnly
        title={channel.name}
        subtitle={now ? `Agora: ${now.title}` : "Ao vivo"}
        url={url}
        backdrop={channel.logo}
        reason={hls ? fallbackReason(true) : "Sua conta só libera o formato .ts, que o navegador não toca. Use um player externo:"}
        onBack={back}
      />
    );
  }

  return (
    <div className={styles.page}>
      <VideoPlayer
        key={id}
        live
        source={{ kind: "hls", url }}
        heading={
          <span style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {channel.logo && <img className={styles.channelLogo} src={channel.logo} alt="" onError={e => (e.currentTarget.style.display = "none")} />}
            {info}
          </span>
        }
        mediaTitle={now?.title ?? channel.name}
        mediaArtist={channel.name}
        artwork={channel.logo}
        onBack={back}
        onNext={next ? () => zap(next) : undefined}
        errorExtra={<StreamFallback url={url} title={channel.name} reason={fallbackReason(false, "m3u8")} />}
        extraControls={
          prev && next ? (
            <>
              <button className={styles.ctrl} onClick={() => zap(prev)} aria-label={`Canal anterior: ${prev.name}`} title={`${prev.name} (PageUp)`}>
                <ChevronUp size={26} />
              </button>
              <button className={styles.ctrl} onClick={() => zap(next)} aria-label={`Próximo canal: ${next.name}`} title={`${next.name} (PageDown)`}>
                <ChevronDown size={26} />
              </button>
            </>
          ) : null
        }
      />
    </div>
  );
}
