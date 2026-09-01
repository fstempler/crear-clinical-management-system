import styles from "./PlaceholderPage.module.scss";
export function PlaceholderPage({ title }) {
  return (
    <main className={styles.page}>
      <section>
        <h1>{title}</h1>
        <p>
          Esta sección está preparada dentro del layout compartido y se
          implementará en su página correspondiente.
        </p>
      </section>
    </main>
  );
}
