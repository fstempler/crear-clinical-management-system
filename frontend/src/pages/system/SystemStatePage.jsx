import { useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import styles from "./SystemStatePage.module.scss";
export function SystemStatePage({ code, title, description, retry, alert = false, back = false }) {
  const heading = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => { heading.current?.focus(); }, [location.pathname]);
  const previous = location.state?.from;
  const previousPath = typeof previous?.pathname === "string" && previous.pathname.startsWith("/") && !previous.pathname.startsWith("//") ? previous.pathname : null;
  const badPath = previousPath && ["/403", "/404", "/error", "/offline"].includes(previousPath);
  const canGoBack = back && Boolean(previousPath) && !badPath && previousPath !== location.pathname;
  return <main className={styles.page}><section className={styles.card} role={alert ? "alert" : undefined}>
    <span className={styles.code} aria-hidden="true">{code}</span><h1 ref={heading} tabIndex={-1}>{title}</h1><p>{description}</p>
    <div className={styles.actions}>{retry && <button type="button" onClick={retry}>Reintentar</button>}<Link to="/">Volver al inicio</Link>{canGoBack && <button className={styles.secondary} type="button" onClick={() => navigate(previousPath)}>Volver atrás</button>}</div>
  </section></main>;
}
