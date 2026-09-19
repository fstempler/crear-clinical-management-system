import { Icon } from "../common/Icon";
import styles from "./Pagination.module.scss";

function visiblePages(current, total) {
  const candidates = new Set([1, total, current - 1, current, current + 1]);
  return [...candidates].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);
}

export function Pagination({
  page,
  totalPages,
  totalItems,
  perPage,
  onChange,
  itemLabel = "pacientes",
  ariaLabel = "Paginación de pacientes",
}) {
  if (!totalItems) return null;
  const first = (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, totalItems);
  const pages = visiblePages(page, totalPages);

  return (
    <div className={styles.footer}>
      <p>
        Mostrando <strong>{first} a {last}</strong> de <strong>{totalItems}</strong> {itemLabel}
      </p>
      <nav className={styles.pagination} aria-label={ariaLabel}>
        <button type="button" disabled={page <= 1} onClick={() => onChange(page - 1)}>
          <Icon className={styles.previousIcon} name="chevron" size={18} />
          Anterior
        </button>
        {pages.map((number, index) => (
          <span className={styles.pageGroup} key={number}>
            {index > 0 && number - pages[index - 1] > 1 && <span aria-hidden="true">…</span>}
            <button
              type="button"
              className={number === page ? styles.current : ""}
              aria-current={number === page ? "page" : undefined}
              aria-label={`Ir a la página ${number}`}
              onClick={() => onChange(number)}
            >
              {number}
            </button>
          </span>
        ))}
        <button type="button" disabled={page >= totalPages} onClick={() => onChange(page + 1)}>
          Siguiente
          <Icon name="chevron" size={18} />
        </button>
      </nav>
    </div>
  );
}
