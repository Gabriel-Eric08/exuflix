const IMG = "https://image.tmdb.org/t/p";

/** URLs completas (Xtream) passam direto; caminhos do TMDB ganham o tamanho. */
const isAbsolute = (path: string) => /^https?:\/\//i.test(path);

export const img = (path: string | null | undefined, size = "w500") =>
  path ? (isAbsolute(path) ? path : `${IMG}/${size}${path}`) : null;

export const posterSrcSet = (path: string | null) =>
  path && !isAbsolute(path) ? `${IMG}/w185${path} 185w, ${IMG}/w342${path} 342w, ${IMG}/w500${path} 500w` : undefined;

export const backdropSrcSet = (path: string | null) =>
  path && !isAbsolute(path) ? `${IMG}/w780${path} 780w, ${IMG}/w1280${path} 1280w, ${IMG}/original${path} 1920w` : undefined;
