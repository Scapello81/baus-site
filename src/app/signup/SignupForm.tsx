"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "@/app/auth/AuthShell";
import styles from "@/app/auth/auth.module.css";
import { createClient } from "@/lib/supabase-browser";

export default function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setMessage("");
    if (password.length < 8) { setError("Пароль должен содержать не менее 8 символов."); return; }
    if (password !== confirmation) { setError("Пароли не совпадают."); return; }

    setLoading(true);
    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/apnoe` },
    });

    if (signUpError) { setError(signUpError.message); setLoading(false); return; }
    if (data.session) { router.replace("/apnoe"); router.refresh(); return; }
    setMessage("Проверь почту и перейди по ссылке, чтобы подтвердить аккаунт.");
    setLoading(false);
  }

  return (
    <AuthShell title="Регистрация" description="Создай аккаунт для хранения планов, тренировок и рекордов." footer={<>Уже есть аккаунт? <Link className={styles.link} href="/login">Войти</Link></>}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>Email<input className={styles.input} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        <label className={styles.field}>Пароль<input className={styles.input} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className={styles.field}>Повтори пароль<input className={styles.input} type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
        <p className={styles.hint}>Минимум 8 символов.</p>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {message && <p className={styles.message} role="status">{message}</p>}
        <button className={styles.button} type="submit" disabled={loading || Boolean(message)}>{loading ? "Создаём…" : "Создать аккаунт"}</button>
      </form>
    </AuthShell>
  );
}
