import { Suspense, type ReactNode } from "react";
import { Outlet, ScrollRestoration, useLocation } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ToastHost } from "../components/Toast";
import { Splash } from "../components/Logo";
import { TrailerHost } from "../components/Trailer";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { CatalogProvider, tmdbCatalog } from "../catalog/CatalogContext";
import { xtreamCatalog } from "../xtream/queries";
import { XtreamModalHost } from "../xtream/LoginModal";
import { XT_BASE } from "./routes";

export const isXtPath = (pathname: string) => pathname === XT_BASE || pathname.startsWith(`${XT_BASE}/`);

/** Exuflix (TMDB) ou Marcondes de Oxóssi (Xtream), conforme a rota. */
export function CatalogFromPath({ children }: { children: ReactNode }) {
  const { pathname } = useLocation();
  return <CatalogProvider value={isXtPath(pathname) ? xtreamCatalog : tmdbCatalog}>{children}</CatalogProvider>;
}

/** Layout com navbar e rodapé (os players ficam fora dele). */
export function AppLayout() {
  return (
    <CatalogFromPath>
      <a href="#conteudo" className="sr-only">Pular para o conteúdo</a>
      <Navbar />
      <div id="conteudo">
        <ErrorBoundary>
          <Suspense fallback={<Splash />}>
            <Outlet />
          </Suspense>
        </ErrorBoundary>
      </div>
      <Footer />
      <ToastHost />
      <TrailerHost />
      <XtreamModalHost />
      <ScrollRestoration getKey={loc => loc.pathname + loc.search} />
    </CatalogFromPath>
  );
}
