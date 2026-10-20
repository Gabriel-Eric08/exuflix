import { lazy } from "react";
import { createBrowserRouter, Route, Routes, useLocation, type Location } from "react-router-dom";
import { AppLayout } from "./App";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";

const Browse = lazy(() => import("../pages/Browse"));
const Categories = lazy(() => import("../pages/Categories"));
const Genre = lazy(() => import("../pages/Genre"));
const Search = lazy(() => import("../pages/Search"));
const MyList = lazy(() => import("../pages/MyList"));
const DetailsPage = lazy(() => import("../pages/Details"));
const DetailsModal = lazy(() => import("../pages/Details").then(m => ({ default: m.DetailsModal })));

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

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [{ path: "*", element: <MainRoutes /> }],
  },
]);
