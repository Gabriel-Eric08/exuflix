import { useEffect, useRef, useState, useSyncExternalStore, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, LogOut, RefreshCw } from "lucide-react";
import { XT_BASE } from "../app/routes";
import { Modal } from "../components/Modal";
import { XtSymbol } from "../components/Logo";
import { toast } from "../components/Toast";
import { read, write } from "../storage/store";
import type { XtreamAccount } from "./client";
import { DISMISSED_KEY, login, logout, useXtreamAccount } from "./credentials";
import styles from "./LoginModal.module.css";

type Mode = "login" | "account" | null;
let mode: Mode = null;
const listeners = new Set<() => void>();
const set = (m: Mode) => {
  mode = m;
  listeners.forEach(l => l());
};

export const openLogin = () => set("login");
export const openAccount = () => set("account");

const SESSION_FLAG = "exuflix:xtream-asked";

/** Pergunta uma vez por sessão enquanto não há conta (a menos que o usuário peça para não perguntar). */
function shouldAsk() {
  if (read<boolean>(DISMISSED_KEY, false)) return false;
  try {
    return !sessionStorage.getItem(SESSION_FLAG);
  } catch {
    return true;
  }
}
function markAsked() {
  try {
    sessionStorage.setItem(SESSION_FLAG, "1");
  } catch {
    /* ignora */
  }
}

/** Modal global: login IPTV (Xtream Codes) e dados da conta. Montado no layout. */
export function XtreamModalHost() {
  const current = useSyncExternalStore(
    cb => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => mode,
  );
  const account = useXtreamAccount();

  // Ao entrar no site sem conta conectada, pergunta
  useEffect(() => {
    if (!account && shouldAsk()) openLogin();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!current) return null;
  const close = () => {
    markAsked();
    set(null);
  };

  return (
    <Modal onClose={close} label={current === "account" && account ? "Conta IPTV" : "Conectar IPTV"} size="md">
      {current === "account" && account ? (
        <AccountView account={account} onClose={close} onSwitch={openLogin} />
      ) : (
        <LoginForm initial={account} onClose={close} />
      )}
    </Modal>
  );
}

/** "dominio.com/get.php?username=u&password=p&type=m3u" colado no campo URL preenche tudo. */
export function parsePastedLink(raw: string): { url: string; username: string; password: string } | null {
  if (!/username=/.test(raw) || !/password=/.test(raw)) return null;
  try {
    const u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `http://${raw.trim()}`);
    const username = u.searchParams.get("username");
    const password = u.searchParams.get("password");
    if (!username || !password) return null;
    return { url: `${u.protocol}//${u.host}`, username, password };
  } catch {
    return null;
  }
}

function LoginForm({ initial, onClose }: { initial: XtreamAccount | null; onClose: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [url, setUrl] = useState(initial?.url ?? "");
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [dontAsk, setDontAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<XtreamAccount | null>(null);
  const urlRef = useRef<HTMLInputElement>(null);
  // O Modal foca o diálogo depois dos filhos montarem: devolve o foco ao primeiro campo
  useEffect(() => {
    const id = requestAnimationFrame(() => urlRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, []);

  const onUrl = (v: string) => {
    const pasted = parsePastedLink(v);
    if (pasted) {
      setUrl(pasted.url);
      setUsername(pasted.username);
      setPassword(pasted.password);
    } else setUrl(v);
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const acc = await login(url, username, password);
      write(DISMISSED_KEY, false);
      setDone(acc);
      toast("Marcondes de Oxóssi liberado");
    } catch (err) {
      setError((err as Error).message || "Não foi possível conectar.");
    } finally {
      setBusy(false);
    }
  };

  const later = () => {
    if (dontAsk) write(DISMISSED_KEY, true);
    onClose();
  };

  if (done) {
    return (
      <div className={styles.body}>
        <Header title="Tudo certo!" text="Sua lista foi conectada. A aba Marcondes de Oxóssi já está liberada." />
        <AccountFacts account={done} />
        <div className={styles.actions}>
          <button
            className="btn btn-primary"
            autoFocus
            onClick={() => {
              onClose();
              if (!location.pathname.startsWith(XT_BASE)) navigate(XT_BASE);
            }}
          >
            Abrir Marcondes de Oxóssi <ArrowRight size={20} />
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Continuar aqui
          </button>
        </div>
      </div>
    );
  }

  return (
    <form className={styles.body} onSubmit={submit} noValidate>
      <Header
        title="Marcondes de Oxóssi"
        text="Tem uma lista IPTV? Conecte com os dados Xtream Codes (URL, usuário e senha) para liberar filmes, séries e TV ao vivo."
      />

      <label className={styles.field}>
        <span>URL do servidor</span>
        <input
          type="text"
          inputMode="url"
          autoComplete="url"
          placeholder="http://dominio.com:8080"
          value={url}
          onChange={e => onUrl(e.target.value)}
          required
          ref={urlRef}
        />
        <small>Dica: dá para colar o link M3U inteiro (get.php?username=…&password=…).</small>
      </label>
      <label className={styles.field}>
        <span>Usuário</span>
        <input type="text" autoComplete="username" autoCapitalize="none" spellCheck={false} value={username} onChange={e => setUsername(e.target.value)} required />
      </label>
      <label className={styles.field}>
        <span>Senha</span>
        <span className={styles.password}>
          <input
            type={show ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
          <button type="button" className={styles.eye} onClick={() => setShow(s => !s)} aria-label={show ? "Esconder senha" : "Mostrar senha"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </span>
      </label>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <div className={styles.actions}>
        <button className="btn btn-primary" type="submit" disabled={busy}>
          {busy ? <RefreshCw size={20} className={styles.spin} /> : null}
          {busy ? "Conectando…" : "Conectar"}
        </button>
        {!initial && (
          <button className="btn btn-ghost" type="button" onClick={later}>
            Agora não
          </button>
        )}
      </div>
      {!initial && (
        <label className={styles.check}>
          <input type="checkbox" checked={dontAsk} onChange={e => setDontAsk(e.target.checked)} /> Não perguntar de novo
        </label>
      )}
      <p className={styles.note}>
        Usuário e senha ficam só neste navegador. O site usa um proxy apenas para conversar com o servidor IPTV, e o vídeo vem direto dele.
      </p>
    </form>
  );
}

function AccountView({ account, onClose, onSwitch }: { account: XtreamAccount; onClose: () => void; onSwitch: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const inside = location.pathname.startsWith(XT_BASE);
  return (
    <div className={styles.body}>
      <Header title="Conta IPTV" text={account.server.host} />
      <AccountFacts account={account} />
      <div className={styles.actions}>
        <button
          className="btn btn-primary"
          autoFocus
          onClick={() => {
            onClose();
            navigate(inside ? "/" : XT_BASE);
          }}
        >
          {inside ? "Voltar para Exuflix" : "Abrir Marcondes de Oxóssi"} <ArrowRight size={20} />
        </button>
        <button className="btn btn-ghost" onClick={onSwitch}>
          Trocar conta
        </button>
        <button
          className="btn btn-outline"
          onClick={() => {
            logout();
            onClose();
            toast("Conta IPTV desconectada");
            if (inside) navigate("/");
          }}
        >
          <LogOut size={18} /> Sair
        </button>
      </div>
    </div>
  );
}

const date = new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "long", year: "numeric" });

function AccountFacts({ account }: { account: XtreamAccount }) {
  const days = account.expiresAt ? Math.ceil((account.expiresAt - Date.now()) / 86_400_000) : null;
  return (
    <dl className={styles.facts}>
      <div>
        <dt>Usuário</dt>
        <dd>{account.username}</dd>
      </div>
      <div>
        <dt>Validade</dt>
        <dd>
          {account.expiresAt ? (
            <>
              {date.format(account.expiresAt)}
              {days !== null && days <= 7 && <span className={styles.warn}> · {days <= 0 ? "vence hoje" : `faltam ${days} dia${days === 1 ? "" : "s"}`}</span>}
            </>
          ) : (
            "Sem data de vencimento"
          )}
          {account.isTrial && <span className={styles.warn}> · teste</span>}
        </dd>
      </div>
      {account.maxConnections !== null && (
        <div>
          <dt>Telas</dt>
          <dd>
            {account.activeConnections ?? 0} de {account.maxConnections} em uso
          </dd>
        </div>
      )}
    </dl>
  );
}

function Header({ title, text }: { title: string; text: string }) {
  return (
    <header className={styles.header}>
      <XtSymbol size={48} />
      <div>
        <h2>{title}</h2>
        <p>{text}</p>
      </div>
    </header>
  );
}
