import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { slugType } from "../app/routes";
import { useHrefs } from "../catalog/CatalogContext";
import { DetailsView } from "../components/DetailsView";
import { Modal } from "../components/Modal";

function useTitleParams() {
  const { tipo, id } = useParams();
  return { type: slugType(tipo), id: Number(id) };
}

/** Acesso direto pela URL: página inteira. */
export default function DetailsPage() {
  const { type, id } = useTitleParams();
  const home = useHrefs().to("/");
  if (!type || !Number.isFinite(id)) return <Navigate to={home} replace />;
  return (
    <main>
      <DetailsView key={`${type}:${id}`} type={type} id={id} page />
    </main>
  );
}

/** Vindo de um card: modal sobre a página de fundo (state.background). */
export function DetailsModal() {
  const { type, id } = useTitleParams();
  const navigate = useNavigate();
  const location = useLocation();
  const home = useHrefs().to("/");
  if (!type || !Number.isFinite(id)) return null;
  const close = () => {
    const bg = (location.state as { background?: { pathname: string; search: string } })?.background;
    // Volta no histórico se possível; senão, vai para o fundo salvo
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(bg ? bg.pathname + bg.search : home, { replace: true });
  };
  return (
    <Modal onClose={close} label="Detalhes do título">
      <DetailsView key={`${type}:${id}`} type={type} id={id} />
    </Modal>
  );
}
