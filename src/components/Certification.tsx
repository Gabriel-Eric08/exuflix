import styles from "./Certification.module.css";

const KNOWN = new Set(["L", "10", "12", "14", "16", "18"]);

/** Selo da Classificação Indicativa (ClassInd) com as cores oficiais. */
export function Certification({ value }: { value: string | null | undefined }) {
  if (!value) return null;
  const v = value.toUpperCase().replace("AL", "L");
  if (!KNOWN.has(v)) return null;
  return (
    <span className={`${styles.badge} ${styles["c" + v]}`} title={v === "L" ? "Livre" : `Não recomendado para menores de ${v} anos`}>
      {v}
    </span>
  );
}
