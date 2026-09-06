import { Link } from "react-router";
import { calculateAge, formatDate } from "../../utils/date";
import {
  getFullName,
  getInitials,
  getPatientDocumentType,
  getPatientStatus,
} from "../../utils/presentation";
import { Icon } from "../common/Icon";
import { Pagination } from "./Pagination";
import styles from "./PatientsResults.module.scss";

function PatientAvatar({ patient }) {
  return (
    <span className={styles.avatar} aria-hidden="true">
      {getInitials(patient.first_name, patient.last_name)}
    </span>
  );
}

function Status({ value }) {
  const status = getPatientStatus(value);
  return <span className={`${styles.status} ${styles[status.tone]}`}>{status.label}</span>;
}

function documentLabel(patient) {
  return `${getPatientDocumentType(patient.document_type)} ${patient.document_number || "no informado"}`;
}

function birthLabel(patient) {
  const age = calculateAge(patient.birth_date);
  return age === null ? "No informada" : `${age} años · ${formatDate(patient.birth_date)}`;
}

export function PatientsResults({ result, onPageChange, perPage }) {
  return (
    <section className={styles.results} aria-label="Resultados de pacientes">
      <div className={styles.desktopTable}>
        <table>
          <thead>
            <tr>
              <th>Paciente</th>
              <th>Documento</th>
              <th>Nacimiento</th>
              <th>Contacto</th>
              <th>Estado</th>
              <th>Admisión</th>
              <th><span className={styles.srOnly}>Acción</span></th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((patient) => (
              <tr key={patient.id}>
                <td><div className={styles.patient}><PatientAvatar patient={patient} /><strong>{getFullName(patient)}</strong></div></td>
                <td>{documentLabel(patient)}</td>
                <td>{birthLabel(patient)}</td>
                <td>{patient.phone || "No informado"}</td>
                <td><Status value={patient.status} /></td>
                <td>{formatDate(patient.admission_date)}</td>
                <td>
                  <Link className={styles.view} to={`/patients/${patient.id}`}>
                    Ver paciente <Icon name="chevron" size={19} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className={styles.mobileCards}>
        {result.items.map((patient) => (
          <article className={styles.card} key={patient.id}>
            <div className={styles.cardHeader}>
              <PatientAvatar patient={patient} />
              <div className={styles.identity}>
                <h2>{getFullName(patient)}</h2>
                <p>{documentLabel(patient)}</p>
              </div>
              <Status value={patient.status} />
            </div>
            <dl>
              <div><dt>Nacimiento</dt><dd>{birthLabel(patient)}</dd></div>
              <div><dt>Teléfono</dt><dd>{patient.phone || "No informado"}</dd></div>
              <div><dt>Admisión</dt><dd>{formatDate(patient.admission_date)}</dd></div>
            </dl>
            <Link className={styles.cardLink} to={`/patients/${patient.id}`}>
              Ver paciente <Icon name="chevron" size={21} />
            </Link>
          </article>
        ))}
      </div>
      <Pagination
        page={result.page}
        totalPages={result.totalPages}
        totalItems={result.totalItems}
        perPage={perPage}
        onChange={onPageChange}
      />
    </section>
  );
}
