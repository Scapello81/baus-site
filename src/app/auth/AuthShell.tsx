import type { ReactNode } from "react";
import styles from "./auth.module.css";

type AuthShellProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
};

export default function AuthShell({ title, description, children, footer }: AuthShellProps) {
  return (
    <main className={styles.page}>
      <section className={styles.card}>
        <div className={styles.brand}>BAUS Training</div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.description}>{description}</p>
        {children}
        {footer && <div className={styles.footer}>{footer}</div>}
      </section>
    </main>
  );
}
