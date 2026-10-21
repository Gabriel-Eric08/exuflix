import { useEffect, useRef, useState } from "react";
import { Download, Trash2, Upload } from "lucide-react";
import { allKeys, read, remove, write } from "../storage/store";
import { usePreferences } from "../storage/preferences";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { Wordmark } from "../components/Logo";
import { TmdbLogo } from "../components/Footer";
import { toast } from "../components/Toast";
import styles from "./About.module.css";

const HISTORY_KEYS = ["progress", "hidden", "searches", "xt:progress", "xt:hidden", "xt:searches"];
// A conta IPTV (com senha) nunca vai para o arquivo de backup
const PRIVATE_KEYS = new Set(["xtream:account"]);

export default function About() {
  useDocumentTitle("Sobre e configurações");
  const [prefs, setPrefs] = usePreferences();
  const fileRef = useRef<HTMLInputElement>(null);

  const exportData = () => {
    const data: Record<string, unknown> = {};
    for (const k of allKeys()) if (!PRIVATE_KEYS.has(k)) data[`exuflix:v1:${k}`] = read(k, null);
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), data }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `exuflix-dados-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const importData = async (file: File) => {
    try {
      const json = JSON.parse(await file.text());
      const entries = Object.entries((json?.data ?? {}) as Record<string, unknown>).filter(([k]) => k.startsWith("exuflix:v1:") && !PRIVATE_KEYS.has(k.slice("exuflix:v1:".length)));
      if (entries.length === 0) throw new Error("vazio");
      for (const [k, v] of entries) write(k.slice("exuflix:v1:".length), v);
      toast("Dados importados");
    } catch {
      toast("Esse arquivo não parece um backup da Exuflix");
    }
  };

  const clearHistory = () => {
    HISTORY_KEYS.forEach(remove);
    toast("Histórico limpo");
  };

  return (
    <main className="page">
      <div className={styles.wrap}>
        <section className={styles.brand}>
          <Wordmark className={styles.wordmark} />
          <p className={styles.tagline}>Toda história passa por aqui.</p>
          <p className={styles.text}>
            Na cultura afro-brasileira, Exu é o guardião dos caminhos e das encruzilhadas. A Exuflix é o ponto onde filmes,
            séries e gêneros se cruzam, e você escolhe para onde ir.
          </p>
        </section>

        <section className={styles.card}>
          <h2>Reprodução</h2>
          <Toggle
            label="Próximo episódio automático"
            hint="Começa o próximo episódio depois de uma contagem de 10 s."
            checked={prefs.autoplayNext}
            onChange={v => setPrefs(p => ({ ...p, autoplayNext: v }))}
          />
          <Toggle
            label="Prévias automáticas"
            hint="Trailers sem som nos destaques (só no computador)."
            checked={prefs.autoplayPreviews}
            onChange={v => setPrefs(p => ({ ...p, autoplayPreviews: v }))}
          />
        </section>

        <section className={styles.card}>
          <h2>Seus dados</h2>
          <p className={styles.text}>
            A Exuflix não pede cadastro: sua lista, o que você assistiu e suas preferências ficam só neste navegador.
          </p>
          <div className={styles.actions}>
            <button className="btn btn-outline" onClick={exportData}>
              <Download size={18} /> Exportar meus dados
            </button>
            <button className="btn btn-outline" onClick={() => fileRef.current?.click()}>
              <Upload size={18} /> Importar
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={e => {
                const f = e.target.files?.[0];
                if (f) importData(f);
                e.target.value = "";
              }}
            />
            <ConfirmButton onConfirm={clearHistory} />
          </div>
        </section>

        <section className={styles.card}>
          <h2>Créditos</h2>
          <div className={styles.tmdb}>
            <TmdbLogo height={20} />
            <p className={styles.text}>Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.</p>
          </div>
          <p className={styles.text}>Dados de disponibilidade (“Onde assistir”): JustWatch.</p>
          <p className={styles.text}>
            Trailers reproduzidos pelo player oficial do YouTube. Vídeos completos apenas de fontes com direito de exibição,
            como os filmes abertos da Blender Foundation (CC BY).
          </p>
        </section>
      </div>
    </main>
  );
}

function Toggle({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className={styles.toggle}>
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      <input type="checkbox" role="switch" checked={checked} onChange={e => onChange(e.target.checked)} />
    </label>
  );
}

/** Confirmação em dois toques (sem diálogo do navegador). */
function ConfirmButton({ onConfirm }: { onConfirm: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const id = setTimeout(() => setArmed(false), 4000);
    return () => clearTimeout(id);
  }, [armed]);
  return (
    <button
      className={`btn btn-outline ${styles.danger}`}
      data-armed={armed || undefined}
      onClick={() => {
        if (armed) onConfirm();
        setArmed(!armed);
      }}
    >
      <Trash2 size={18} /> {armed ? "Toque de novo para confirmar" : "Limpar histórico"}
    </button>
  );
}
