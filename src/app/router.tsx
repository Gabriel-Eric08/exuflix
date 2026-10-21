import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, Route, Routes, useLocation, useParams, type Location } from "react-router-dom";
import { AppLayout, CatalogFromPath } from "./App";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import { PlayerSkeleton } from "../player/PlayerSkeleton";
import { ErrorBoundary } from "../components/ErrorBoundary";
import { ToastHost } from "../components/Toast";
import { XtGuard } from "../xtream/pages/shared";
import { XT_BASE } from "./routes";

const Browse = lazy(() => import("../pages/Browse"));
const Categories = lazy(() => import("../pages/Categories"));
const Genre = lazy(() => import("../pages/Genre"));
const Search = lazy(() => import("../pages/Search"));
const MyList = lazy(() => import("../pages/MyList"));
const About = lazy(() => import("../pages/About"));
const DetailsPage = lazy(() => import("../pages/Details"));
const DetailsModal = lazy(() => import("../pages/Details").then(m => ({ default: m.DetailsModal })));

// Marcondes de Oxóssi (Xtream Codes): chunks próprios, só baixam quando a área é aberta
const XtHome = lazy(() => import("../xtream/pages/XtHome"));
const XtBrowse = lazy(() => import("../xtream/pages/XtBrowse"));
const XtCategories = lazy(() => import("../xtream/pages/XtCategories"));
const XtGenre = lazy(() => import("../xtream/pages/XtCategories").then(m => ({ default: m.XtGenre })));
const XtSearch = lazy(() => import("../xtream/pages/XtSearch"));
const LiveTV = lazy(() => import("../xtream/pages/LiveTV"));

// Players em chunks próprios: o hls.js só baixa quando alguém dá play
const MoviePlayerPage = lazy(() => import("../player/MoviePlayerPage"));
const SeriesPlayerPage = lazy(() => import("../player/SeriesPlayerPage"));
const SeriesEntry = lazy(() => import("../player/SeriesPlayerPage").then(m => ({ default: m.SeriesEntry })));
const XtMoviePlayer = lazy(() => import("../player/XtPlayerPages").then(m => ({ default: m.XtMoviePlayer })));
const XtSeriesPlayer = lazy(() => import("../player/XtPlayerPages").then(m => ({ default: m.XtSeriesPlayer })));
const XtSeriesEntry = lazy(() => import("../player/XtPlayerPages").then(m => ({ default: m.XtSeriesEntry })));
const LivePlayerPage = lazy(() => import("../player/LivePlayerPage"));

/** Páginas com navbar. Com state.background, os detalhes abrem como modal sobre a página de fundo. */
function MainRoutes() {
  const location = useLocation();
  const background = (location.state as { background?: Location } | null)?.background;

  return (
    <>
      <Routes location={background ?? location}>
        <Route path="/" element={<Home />} />
        <Route path="/series" element={<Browse key="tv" type="tv" />} />
        <Route path="/filmes" element={<Browse key="movie" type="movie" />} />
        <Route path="/categorias" element={<Categories />} />
        <Route path="/categorias/:tipo/:genero" element={<Genre />} />
        <Route path="/busca" element={<Search />} />
        <Route path="/minha-lista" element={<MyList />} />
        <Route path="/sobre" element={<About />} />
        <Route path="/titulo/:tipo/:id" element={<DetailsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {background && (
        <Routes>
          <Route path="/titulo/:tipo/:id" element={<DetailsModal />} />
        </Routes>
      )}
    </>
  );
}

/** /pai-marcondes/*: mesmas telas, catálogo vindo da lista IPTV. */
function XtRoutes() {
  const location = useLocation();
  const background = (location.state as { background?: Location } | null)?.background;

  return (
    <XtGuard>
      <Routes location={background ?? location}>
        <Route path="/" element={<XtHome />} />
        <Route path="/ao-vivo" element={<LiveTV />} />
        <Route path="/series" element={<XtBrowse key="tv" type="tv" />} />
        <Route path="/filmes" element={<XtBrowse key="movie" type="movie" />} />
        <Route path="/categorias" element={<XtCategories />} />
        <Route path="/categorias/:tipo/:id" element={<XtGenre />} />
        <Route path="/busca" element={<XtSearch />} />
        <Route path="/minha-lista" element={<MyList />} />
        <Route path="/titulo/:tipo/:id" element={<DetailsPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      {background && (
        <Routes>
          <Route path="/titulo/:tipo/:id" element={<DetailsModal />} />
        </Routes>
      )}
    </XtGuard>
  );
}

function PlayerShell() {
  return (
    <CatalogFromPath>
      <ErrorBoundary>
        <Suspense fallback={<PlayerSkeleton />}>
          <Outlet />
        </Suspense>
      </ErrorBoundary>
      <ToastHost />
    </CatalogFromPath>
  );
}

function KeyedMoviePlayer() {
  const { id } = useParams();
  return <MoviePlayerPage key={id} />;
}

function KeyedSeriesPlayer() {
  const { id } = useParams();
  return <SeriesPlayerPage key={id} />;
}

function KeyedXtMoviePlayer() {
  const { id } = useParams();
  return <XtMoviePlayer key={id} />;
}

function KeyedXtSeriesPlayer() {
  const { id } = useParams();
  return <XtSeriesPlayer key={id} />;
}

export const router = createBrowserRouter([
  {
    element: <PlayerShell />,
    children: [
      { path: "/assistir/filme/:id", element: <KeyedMoviePlayer /> },
      { path: "/assistir/serie/:id", element: <SeriesEntry /> },
      { path: "/assistir/serie/:id/:temporada/:episodio", element: <KeyedSeriesPlayer /> },
      { path: `${XT_BASE}/assistir/filme/:id`, element: <KeyedXtMoviePlayer /> },
      { path: `${XT_BASE}/assistir/serie/:id`, element: <XtSeriesEntry /> },
      { path: `${XT_BASE}/assistir/serie/:id/:temporada/:episodio`, element: <KeyedXtSeriesPlayer /> },
      { path: `${XT_BASE}/ao-vivo/:id`, element: <LivePlayerPage /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [
      { path: `${XT_BASE}/*`, element: <XtRoutes /> },
      { path: "*", element: <MainRoutes /> },
    ],
  },
]);
