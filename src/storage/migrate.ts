const CURRENT = 1;

export function migrate() {
  try {
    const v = Number(localStorage.getItem("exuflix:schema") ?? 0);
    if (v === CURRENT) return;
    // if (v < 2) { ...transformar exuflix:v1:* em exuflix:v2:* ... }
    localStorage.setItem("exuflix:schema", String(CURRENT));
  } catch {
    /* storage indisponível: app funciona só em memória */
  }
}
