import { lazy, Suspense } from "react";
import { createBrowserRouter, Outlet, Route, Routes, useLocation, useParams, type Location } from "react-router-dom";
import { AppLayout } from "./App";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";
import { PlayerSkeleton } from "../player/PlayerSkeleton";

const Browse = lazy(() => import("../pages/Browse"));
const Categories = lazy(() => import("../pages/Categories"));
const Genre = lazy(() => import("../pages/Genre"));
const Search = lazy(() => import("../pages/Search"));
const MyList = lazy(() => import("../pages/MyList"));
const About = lazy(() => import("../pages/About"));
const DetailsPage = lazy(() => import("../pages/Details"));
const DetailsModal = lazy(() => import("../pages/Details").then(m => ({ default: m.DetailsModal })));

// Players em chunks próprios: o hls.js só baixa quando alguém dá play
const MoviePlayerPage = lazy(() => import("../player/MoviePlayerPage"));
const SeriesPlayerPage = lazy(() => import("../player/SeriesPlayerPage"));
const SeriesEntry = lazy(() => import("../player/SeriesPlayerPage").then(m => ({ default: m.SeriesEntry })));

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

function PlayerShell() {
  return (
    <Suspense fallback={<PlayerSkeleton />}>
      <Outlet />
    </Suspense>
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

export const router = createBrowserRouter([
  {
    element: <PlayerShell />,
    children: [
      { path: "/assistir/filme/:id", element: <KeyedMoviePlayer /> },
      { path: "/assistir/serie/:id", element: <SeriesEntry /> },
      { path: "/assistir/serie/:id/:temporada/:episodio", element: <KeyedSeriesPlayer /> },
    ],
  },
  {
    element: <AppLayout />,
    children: [{ path: "*", element: <MainRoutes /> }],
  },
]);
