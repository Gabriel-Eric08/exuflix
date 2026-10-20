import { Suspense } from "react";
import { Outlet, ScrollRestoration } from "react-router-dom";
import { Navbar } from "../components/Navbar";
import { Footer } from "../components/Footer";
import { ToastHost } from "../components/Toast";
import { Splash } from "../components/Logo";
import { TrailerHost } from "../components/Trailer";
import { ErrorBoundary } from "../components/ErrorBoundary";

/** Layout com navbar e rodapé (os players ficam fora dele). */
export function AppLayout() {
  return (
    <>
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
      <ScrollRestoration getKey={loc => loc.pathname + loc.search} />
    </>
  );
}

