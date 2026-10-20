import { Component, type ReactNode } from "react";
import { Symbol } from "./Logo";

/** Evita tela branca: mostra uma saída se algum componente quebrar. */
export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[Exuflix]", error);
  }

  render() {
    if (!this.state.error) return this.props.children;
    // Chunk antigo depois de um deploy novo: recarregar resolve
    const stale = /dynamically imported module|Loading chunk|Importing a module script failed/i.test(this.state.error.message);
    return (
      <main className="page">
        <div className="empty">
          <div style={{ display: "grid", placeItems: "center", marginBottom: 24 }}>
            <Symbol size={64} />
          </div>
          <h1 className="page-title" style={{ padding: 0, marginBottom: 12 }}>
            {stale ? "Tem novidade na Exuflix" : "Algo saiu do caminho"}
          </h1>
          <p style={{ marginBottom: 24 }}>
            {stale ? "Uma versão nova foi publicada. Recarregue para continuar." : "A gente tropeçou aqui. Tente de novo."}
          </p>
          <button className="btn btn-primary" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      </main>
    );
  }
}
