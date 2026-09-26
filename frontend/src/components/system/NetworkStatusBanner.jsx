import { useEffect, useState } from "react";
import styles from "./NetworkStatusBanner.module.scss";
export function NetworkStatusBanner() {
  const [message, setMessage] = useState(() => navigator.onLine ? "" : "Sin conexión. Algunas funciones pueden no estar disponibles.");
  const [online, setOnline] = useState(() => navigator.onLine);
  useEffect(() => {
    let timer;
    const offline = () => { window.clearTimeout(timer); setOnline(false); setMessage("Sin conexión. Algunas funciones pueden no estar disponibles."); };
    const restored = () => { window.clearTimeout(timer); setOnline(true); setMessage("Conexión restablecida."); timer = window.setTimeout(() => setMessage(""), 4500); };
    window.addEventListener("offline", offline);
    window.addEventListener("online", restored);
    return () => { window.clearTimeout(timer); window.removeEventListener("offline", offline); window.removeEventListener("online", restored); };
  }, []);
  if (!message) return null;
  return <div className={`${styles.banner} ${online ? styles.restored : ""}`} role="status" aria-live="polite">{message}</div>;
}
