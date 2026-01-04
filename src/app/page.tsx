import { ControlButton } from "./ControlButton";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Anton Baus</h1>
          <div className={styles.sub}>
            Ansbacher Str. 63 · 10777 Berlin
          </div>
        </header>

        <div className={styles.grid}>
          <section className={styles.card}>
            <h2 className={styles.h2}>Kontakt</h2>

            <div className={styles.row}>
              <span className={styles.label}>Telefon</span>
              <a className={styles.link} href="tel:+491722425657">
                +49 172 2425657
              </a>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>E-Mail</span>
              <a className={styles.link} href="mailto:anton.baus@icloud.com">
                anton.baus@icloud.com
              </a>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Fax</span>
              <a className={styles.link} href="tel:+493022004615">
                +49 30 22004615
              </a>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Web</span>
              <a
                className={styles.link}
                href="https://baus-online.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                baus-online.de
              </a>
            </div>

            <div className={styles.row}>
              <span className={styles.label}>Control</span>
              <a
                className={styles.link}
                href="https://control.baus-online.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                control.baus-online.de
              </a>
            </div>

            <div className={styles.actions}>
              <a className={styles.btn} href="/api/vcard">
                Kontakt speichern (.vcf)
              </a>
              <a
                className={styles.btnSecondary}
                href="https://control.baus-online.de"
                target="_blank"
                rel="noopener noreferrer"
              >
                Control öffnen
              </a>
            </div>

            <div className={styles.card2}>
              <h2 className={styles.h2}>Steckdose</h2>
              <ControlButton />
            </div>
          </section>

          <aside className={styles.card}>
            <h2 className={styles.h2}>QR Kontakt (vCard)</h2>
            <div className={styles.qrWrap}>
              <img className={styles.qr} src="/api/vcard-qr" alt="vCard QR" />
            </div>
            <div className={styles.hint}>
              Kamera öffnen → QR scannen → Kontakt hinzufügen.
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}
