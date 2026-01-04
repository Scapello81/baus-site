import { ControlButton } from "./ControlButton";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>Anton Baus</h1>

        <div className={styles.card}>
          <div className={styles.row}>
            <span className={styles.label}>Сайт:</span>
            <a className={styles.link} href="https://baus-online.de">
              baus-online.de
            </a>
          </div>

          <div className={styles.row}>
            <span className={styles.label}>Control:</span>
            <a className={styles.link} href="https://control.baus-online.de">
              control.baus-online.de
            </a>
          </div>
        </div>

        <div className={styles.card}>
          <h2 className={styles.h2}>Управление</h2>
          <ControlButton />
        </div>
      </main>
    </div>
  );
}
