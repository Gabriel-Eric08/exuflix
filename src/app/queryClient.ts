import { QueryClient } from "@tanstack/react-query";
import { TmdbError } from "../api/tmdb";
import { XtreamError } from "../xtream/client";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 60 * 1000,
      gcTime: 6 * 60 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: (count, err) => {
        // IPTV: conta recusada não melhora tentando de novo; servidor lento ganha só mais uma chance
        if (err instanceof XtreamError) return err.status >= 500 && count < 1;
        return !(err instanceof TmdbError && err.status === 404) && count < 2;
      },
    },
  },
});
