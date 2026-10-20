/** 3733 → "1:02:13"; 73 → "1:13" */
export function formatTime(sec: number) {
  if (!isFinite(sec) || sec < 0) sec = 0;
  const s = Math.floor(sec % 60);
  const m = Math.floor((sec / 60) % 60);
  const h = Math.floor(sec / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${m}:${pad(s)}`;
}

/** Texto para leitores de tela: "42 minutos de 1 hora e 48" */
export function spokenTime(pos: number, dur: number) {
  const part = (sec: number) => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    if (h && m) return `${h} hora${h > 1 ? "s" : ""} e ${m}`;
    if (h) return `${h} hora${h > 1 ? "s" : ""}`;
    return `${m} minuto${m === 1 ? "" : "s"}`;
  };
  return `${part(pos)} de ${part(dur)}`;
}
