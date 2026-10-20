import { Symbol } from "../components/Logo";
import styles from "./Player.module.css";

export function PlayerSkeleton() {
  return (
    <div className={styles.skeleton} role="status" aria-label="Carregando">
      <Symbol size={72} animated plate={false} />
    </div>
  );
}
