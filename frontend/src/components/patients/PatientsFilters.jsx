import { useState } from "react";
import { Icon } from "../common/Icon";
import styles from "./PatientsFilters.module.scss";

export function PatientsFilters({ search, status, onSearch, onStatus, onClear }) {
  const [value, setValue] = useState(search);

  const submit = (event) => {
    event.preventDefault();
    onSearch(value.trim());
  };

  return (
    <form className={styles.filters} onSubmit={submit}>
      <div className={styles.searchField}>
        <label htmlFor="patients-search">Buscar</label>
        <div className={styles.inputWrap}>
          <Icon name="search" size={22} />
          <input
            id="patients-search"
            type="search"
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder="Buscar por nombre, apellido o documento"
          />
          {value && (
            <button
              type="button"
              aria-label="Limpiar búsqueda"
              onClick={() => {
                setValue("");
                onSearch("");
              }}
            >
              <Icon name="clear" size={19} />
            </button>
          )}
        </div>
      </div>
      <div className={styles.statusField}>
        <label htmlFor="patients-status">Estado</label>
        <select
          id="patients-status"
          value={status}
          onChange={(event) => onStatus(event.target.value)}
        >
          <option value="">Todos</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
          <option value="discharged">Dado de alta</option>
        </select>
      </div>
      <button className={styles.submit} type="submit">Buscar</button>
      {(search || status) && (
        <button
          className={styles.clear}
          type="button"
          onClick={() => {
            setValue("");
            onClear();
          }}
        >
          Limpiar filtros
        </button>
      )}
    </form>
  );
}
