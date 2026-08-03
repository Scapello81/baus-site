"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "@/app/auth/AuthShell";
import styles from "@/app/auth/auth.module.css";
import { createClient } from "@/lib/supabase-browser";

export default function LoginForm({ initialError = "" }: { initialError?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(initialError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (signInError) {
      setError("Не удалось войти. Проверь email, пароль и подтверждение почты.");
      setLoading(false);
      return;
    }

    router.replace("/apnoe");
    router.refresh();
  }

  return (
    <AuthShell title="Вход" description="Войди по email и паролю, чтобы продолжить тренировки." footer={<>Нет аккаунта? <Link className={styles.link} href="/signup">Создать</Link></>}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>Email<input className={styles.input} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="email@example.com" /></label>
        <label className={styles.field}>Пароль<input className={styles.input} type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <div className={styles.links}><Link className={styles.link} href="/forgot-password">Забыли пароль?</Link></div>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.button} type="submit" disabled={loading}>{loading ? "Входим…" : "Войти"}</button>
      </form>
    </AuthShell>
  );
}
