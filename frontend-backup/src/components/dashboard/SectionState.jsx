import { Icon } from "../common/Icon";
import styles from "./SectionState.module.scss";
export function SectionState({ type, message, onRetry }) {
  return (
    <div
      className={`${styles.state} ${styles[type]}`}
      role={type === "error" ? "alert" : "status"}
    >
      {type === "loading" && (
        <span className={styles.spinner} aria-hidden="true" />
      )}
      <p>{message}</p>
      {type === "error" && (
        <button type="button" onClick={onRetry}>
          <Icon name="retry" size={18} />
          Reintentar
        </button>
      )}
    </div>
  );
}
