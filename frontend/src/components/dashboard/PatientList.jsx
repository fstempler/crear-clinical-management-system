import { Link } from "react-router";
import {
  getFullName,
  getInitials,
  getPatientStatus,
} from "../../utils/presentation";
import { SectionState } from "./SectionState";
import styles from "./PatientList.module.scss";

export function PatientList({ section, professional }) {

  const title = professional ? "Pacientes asignados" : "Pacientes recientes";
  
  return (
    <section className={styles.card}>
      <header>
        <h2>{title}</h2>
        <Link to="/patients">Ver todos</Link>
      </header>
      {section.isLoading ? (
        <SectionState type="loading" message="Cargando pacientes…" />
      ) : section.error ? (
        <SectionState
          type="error"
          message="No se pudieron cargar los pacientes."
          onRetry={section.retry}
        />
      ) : !section.data?.length ? (
        <SectionState
          type="empty"
          message={
            professional
              ? "Todavía no tenés pacientes asignados."
              : "Todavía no hay pacientes registrados."
          }
        />
      ) : (
        <div>
          {section.data.map((patient) => {
            const status = getPatientStatus(patient.status);
            return (
              <article className={styles.row} key={patient.id}>
                <span className={styles.avatar}>
                  {getInitials(patient.first_name, patient.last_name)}
                </span>
                <div className={styles.identity}>
                  <strong>{getFullName(patient)}</strong>
                  <span>
                    {patient.document_number
                      ? `DNI: ${patient.document_number}`
                      : "DNI no informado"}
                  </span>
                </div>
                <span className={`${styles.status} ${styles[status.tone]}`}>
                  <i />
                  {status.label}
                </span>
                <Link className={styles.link} to={`/patients/${patient.id}`}>
                  Ver paciente
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
