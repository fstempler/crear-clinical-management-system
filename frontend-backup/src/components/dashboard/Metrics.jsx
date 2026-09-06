import { SectionState } from "./SectionState";
import styles from "./Metrics.module.scss";
export function Metrics({ section, role }) {
  if (section.isLoading)
    return (
      <section className={styles.wrapper}>
        <SectionState type="loading" message="Cargando métricas…" />
      </section>
    );
  if (section.error)
    return (
      <section className={styles.wrapper}>
        <SectionState
          type="error"
          message="No se pudieron calcular las métricas."
          onRetry={section.retry}
        />
      </section>
    );
  const items =
    role === "admin"
      ? [
          {
            value: section.data?.activePatients ?? 0,
            label: "Pacientes activos",
          },
          { value: section.data?.professionals ?? 0, label: "Profesionales" },
        ]
      : [
          {
            value: section.data?.activePatients ?? 0,
            label: "Pacientes activos asignados",
          },
        ];
  return (
    <section className={styles.grid} aria-label="Métricas">
      {items.map((item) => (
        <article key={item.label}>
          <strong>{item.value}</strong>
          <span>{item.label}</span>
        </article>
      ))}
    </section>
  );
}
