import { Link } from "react-router-dom";
import { Symbol } from "../components/Logo";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function NotFound() {
  useDocumentTitle("Página não encontrada");
  return (
    <main className="page">
      <div className="empty">
        <div style={{ display: "grid", placeItems: "center", marginBottom: 24 }}>
          <Symbol size={64} />
        </div>
        <h1 className="page-title" style={{ padding: 0, marginBottom: 12 }}>Esse caminho não leva a lugar nenhum</h1>
        <p style={{ marginBottom: 24 }}>A página que você procurou não existe ou mudou de lugar.</p>
        <Link to="/" className="btn btn-primary">Voltar para o início</Link>
      </div>
    </main>
  );
}
