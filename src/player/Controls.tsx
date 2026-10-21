import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  Check,
  Maximize,
  Minimize,
  Pause,
  PictureInPicture2,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  Subtitles,
  Volume1,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ProgressBar } from "./ProgressBar";
import { formatTime } from "./format";
import styles from "./Player.module.css";

export interface MenuOption {
  value: string | number;
  label: string;
}

interface Props {
  heading: ReactNode;
  onBack: () => void;
  playing: boolean;
  current: number;
  duration: number;
  buffered: number;
  volume: number;
  muted: boolean;
  fullscreen: boolean;
  rate: number;
  rates: number[];
  subtitle: string | null;
  subtitleOptions: MenuOption[];
  levels: MenuOption[];
  level: number;
  audioTracks: MenuOption[];
  audioTrack: number;
  pip: boolean;
  onTogglePlay: () => void;
  onSeek: (t: number) => void;
  onSeekBy: (s: number) => void;
  onVolume: (v: number) => void;
  onToggleMute: () => void;
  onToggleFullscreen: () => void;
  onTogglePip: () => void;
  onSubtitle: (lang: string | null) => void;
  onRate: (r: number) => void;
  onLevel: (i: number) => void;
  onAudio: (i: number) => void;
  extra?: ReactNode;
  live?: boolean;
  onMenuActivity: () => void;
}

type Menu = "subs" | "settings" | null;

export function Controls(p: Props) {
  const [menu, setMenu] = useState<Menu>(null);
  const VolumeIcon = p.muted || p.volume === 0 ? VolumeX : p.volume < 0.5 ? Volume1 : Volume2;
  const fmtRate = (r: number) => (r === 1 ? "Normal" : `${String(r).replace(".", ",")}x`);

  return (
    <div className={styles.controls}>
      <div className={styles.topBar}>
        <button className={styles.ctrl} onClick={p.onBack} aria-label="Voltar">
          <ArrowLeft size={28} />
        </button>
        <div className={styles.heading}>{p.heading}</div>
      </div>

      <div className={styles.bottomBar}>
        {p.live ? (
          <div className={styles.timeline}>
            <span className={styles.liveBadge}>Ao vivo</span>
          </div>
        ) : (
          <div className={styles.timeline}>
            <ProgressBar current={p.current} duration={p.duration} buffered={p.buffered} onSeek={p.onSeek} />
            <span className={`${styles.time} tabular`}>
              {formatTime(p.current)} / {formatTime(p.duration)}
            </span>
          </div>
        )}

        <div className={styles.buttons}>
          <button className={styles.ctrl} onClick={p.onTogglePlay} aria-label={p.playing ? "Pausar" : "Reproduzir"}>
            {p.playing ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" />}
          </button>
          {!p.live && (
            <>
              <button className={`${styles.ctrl} ${styles.skip}`} onClick={() => p.onSeekBy(-10)} aria-label="Voltar 10 segundos">
                <RotateCcw size={24} />
                <span>10</span>
              </button>
              <button className={`${styles.ctrl} ${styles.skip}`} onClick={() => p.onSeekBy(10)} aria-label="Avançar 10 segundos">
                <RotateCw size={24} />
                <span>10</span>
              </button>
            </>
          )}
          <div className={styles.volume}>
            <button className={styles.ctrl} onClick={p.onToggleMute} aria-label={p.muted ? "Ativar som" : "Silenciar"}>
              <VolumeIcon size={26} />
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={p.muted ? 0 : p.volume}
              onChange={e => p.onVolume(Number(e.target.value))}
              aria-label="Volume"
              style={{ "--vol": `${(p.muted ? 0 : p.volume) * 100}%` } as React.CSSProperties}
            />
          </div>

          <div className={styles.spacer} />

          {p.extra}

          {p.subtitleOptions.length > 0 && (
            <Popover
              open={menu === "subs"}
              onOpenChange={o => setMenu(o ? "subs" : null)}
              onActivity={p.onMenuActivity}
              trigger={<Subtitles size={26} />}
              label="Legendas"
              active={!!p.subtitle}
            >
              <MenuGroup title="Legendas">
                <MenuItem selected={!p.subtitle} onClick={() => p.onSubtitle(null)}>Desligadas</MenuItem>
                {p.subtitleOptions.map(o => (
                  <MenuItem key={o.value} selected={p.subtitle === o.value} onClick={() => p.onSubtitle(String(o.value))}>
                    {o.label}
                  </MenuItem>
                ))}
              </MenuGroup>
            </Popover>
          )}

          <Popover
            open={menu === "settings"}
            onOpenChange={o => setMenu(o ? "settings" : null)}
            onActivity={p.onMenuActivity}
            trigger={<Settings size={24} />}
            label="Configurações"
          >
            <MenuGroup title="Velocidade">
              {p.rates.map(r => (
                <MenuItem key={r} selected={p.rate === r} onClick={() => p.onRate(r)}>
                  {fmtRate(r)}
                </MenuItem>
              ))}
            </MenuGroup>
            {p.levels.length > 1 && (
              <MenuGroup title="Qualidade">
                <MenuItem selected={p.level === -1} onClick={() => p.onLevel(-1)}>Automática</MenuItem>
                {p.levels.map(o => (
                  <MenuItem key={o.value} selected={p.level === o.value} onClick={() => p.onLevel(Number(o.value))}>
                    {o.label}
                  </MenuItem>
                ))}
              </MenuGroup>
            )}
            {p.audioTracks.length > 1 && (
              <MenuGroup title="Áudio">
                {p.audioTracks.map(o => (
                  <MenuItem key={o.value} selected={p.audioTrack === o.value} onClick={() => p.onAudio(Number(o.value))}>
                    {o.label}
                  </MenuItem>
                ))}
              </MenuGroup>
            )}
          </Popover>

          {p.pip && (
            <button className={`${styles.ctrl} ${styles.hideMobile}`} onClick={p.onTogglePip} aria-label="Picture-in-Picture">
              <PictureInPicture2 size={24} />
            </button>
          )}
          <button className={styles.ctrl} onClick={p.onToggleFullscreen} aria-label={p.fullscreen ? "Sair da tela cheia" : "Tela cheia"}>
            {p.fullscreen ? <Minimize size={26} /> : <Maximize size={26} />}
          </button>
        </div>
      </div>
    </div>
  );
}

function Popover({
  open,
  onOpenChange,
  onActivity,
  trigger,
  label,
  active,
  children,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onActivity: () => void;
  trigger: ReactNode;
  label: string;
  active?: boolean;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const cb = useRef({ onOpenChange, onActivity });
  cb.current = { onOpenChange, onActivity };
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) cb.current.onOpenChange(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopImmediatePropagation();
        cb.current.onOpenChange(false);
      }
    };
    document.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey, { capture: true });
    // Mantém os controles visíveis enquanto o menu está aberto
    const keepAlive = setInterval(() => cb.current.onActivity(), 1000);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey, { capture: true });
      clearInterval(keepAlive);
    };
  }, [open]);

  return (
    <div ref={ref} className={styles.popoverWrap}>
      <button
        className={`${styles.ctrl} ${active ? styles.ctrlActive : ""}`}
        onClick={() => onOpenChange(!open)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {trigger}
      </button>
      {open && (
        <div className={styles.popover} role="menu" aria-label={label}>
          {children}
        </div>
      )}
    </div>
  );
}

function MenuGroup({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.menuGroup} role="group" aria-label={title}>
      <p className={styles.menuTitle}>{title}</p>
      {children}
    </div>
  );
}

function MenuItem({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button role="menuitemradio" aria-checked={selected} className={styles.menuItem} onClick={onClick}>
      <span className={styles.menuCheck}>{selected && <Check size={16} />}</span>
      {children}
    </button>
  );
}
