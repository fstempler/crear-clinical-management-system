import styles from "./RouteLoadingFallback.module.scss";
export function RouteLoadingFallback() {
  return <div className={styles.loading} role="status" aria-live="polite"><img src="/crear-logo.png" alt="CREAR" /><span className={styles.spinner} aria-hidden="true" /><p>Cargando…</p></div>;
}
