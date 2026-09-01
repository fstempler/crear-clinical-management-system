import { Link } from "react-router";
import { formatDateTime } from "../../utils/date";
import { getFullName } from "../../utils/presentation";
import { Icon } from "../common/Icon";
import { SectionState } from "./SectionState";
import styles from "./EvolutionList.module.scss";
function getSummary(item) {
  return (
    item.summary ||
    item.evolution ||
    item.content ||
    item.notes ||
    "Sin resumen disponible."
  );
}
export function EvolutionList({ section }) {
  return (
    <section className={styles.card}>
      <h2>Mis últimas evoluciones</h2>
      {section.isLoading ? (
        <SectionState type="loading" message="Cargando evoluciones…" />
      ) : section.error ? (
        <SectionState
          type="error"
          message="No se pudieron cargar tus evoluciones."
          onRetry={section.retry}
        />
      ) : !section.data?.length ? (
        <SectionState
          type="empty"
          message="Todavía no registraste evoluciones."
        />
      ) : (
        <div className={styles.list}>
          {section.data.map((item) => (
            <Link
              className={styles.item}
              to={`/evolutions/${item.id}`}
              key={item.id}
            >
              <span className={styles.dot} />
              <div>
                <strong>{getFullName(item.expand?.patient)}</strong>
                <span className={styles.date}>
                  <Icon name="calendar" size={16} />
                  {formatDateTime(item.evolution_date || item.created)}
                </span>
                <p>{getSummary(item)}</p>
              </div>
              <Icon name="chevron" size={20} />
            </Link>
          ))}
        </div>
      )}
      <Link className={styles.history} to="/activity">
        Ver historial completo
      </Link>
    </section>
  );
}
