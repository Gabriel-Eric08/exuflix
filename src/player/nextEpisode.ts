export function nextEpisode(
  seasons: { number: number; episodeCount: number }[],
  s: number,
  e: number,
): { season: number; episode: number } | null {
  const current = seasons.find(x => x.number === s);
  if (current && e < current.episodeCount) return { season: s, episode: e + 1 };
  const next = seasons.filter(x => x.number > s && x.episodeCount > 0).sort((a, b) => a.number - b.number)[0];
  return next ? { season: next.number, episode: 1 } : null;
}

export function previousEpisode(
  seasons: { number: number; episodeCount: number }[],
  s: number,
  e: number,
): { season: number; episode: number } | null {
  if (e > 1) return { season: s, episode: e - 1 };
  const prev = seasons.filter(x => x.number < s && x.episodeCount > 0).sort((a, b) => b.number - a.number)[0];
  return prev ? { season: prev.number, episode: prev.episodeCount } : null;
}
