import { QueryClient } from "@tanstack/react-query";
import { TmdbError } from "../api/tmdb";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000,
      gcTime: 6 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (count, err) => !(err instanceof TmdbError && err.status === 404) && count < 2,
    },
  },
});
