import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "./App";
import Home from "../pages/Home";
import NotFound from "../pages/NotFound";

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "*", element: <NotFound /> },
    ],
  },
]);
