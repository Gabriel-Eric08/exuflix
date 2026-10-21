import { Copy, Download, ExternalLink, MonitorPlay } from "lucide-react";
import { m3uFor } from "../xtream/client";
import { toast } from "../components/Toast";
import styles from "./Player.module.css";

/** Saídas para quando o navegador não toca o stream: VLC, nova aba, link copiado ou .m3u. */
export function StreamFallback({ url, title, reason }: { url: string; title: string; reason?: string }) {
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copiado");
    } catch {
      toast("Não foi possível copiar o link");
    }
  };
  const download = () => {
    const blob = new Blob([m3uFor(title, url)], { type: "audio/x-mpegurl" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${title.replace(/[\\/:*?"<>|]+/g, "").slice(0, 80) || "video"}.m3u`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <div className={styles.fallback}>
      {reason && <p>{reason}</p>}
      <div className={styles.fallbackActions}>
        <a className="btn btn-light" href={`vlc://${url}`}>
          <MonitorPlay size={20} /> Abrir no VLC
        </a>
        <a className="btn btn-ghost" href={url} target="_blank" rel="noreferrer noopener">
          <ExternalLink size={20} /> Abrir em nova aba
        </a>
        <button className="btn btn-ghost" onClick={copy}>
          <Copy size={20} /> Copiar link
        </button>
        <button className="btn btn-ghost" onClick={download}>
          <Download size={20} /> Baixar .m3u
        </button>
      </div>
    </div>
  );
}

/** Explica por que o vídeo pode não tocar aqui. */
export function fallbackReason(mixed: boolean, container?: string | null) {
  if (mixed) return "Este servidor IPTV só entrega vídeo por HTTP, e o navegador bloqueia vídeo HTTP dentro de um site HTTPS. Use um player externo:";
  if (container && !["mp4", "m4v", "m3u8", "webm"].includes(container.toLowerCase()))
    return `Arquivos .${container} podem usar codecs que o navegador não toca (HEVC, AC3...). Se não funcionar aqui, use um player externo:`;
  return "Se o vídeo não tocar aqui, use um player externo:";
}
