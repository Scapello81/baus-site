"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import AuthShell from "@/app/auth/AuthShell";
import styles from "@/app/auth/auth.module.css";
import { createClient } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setMessage(""); setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
    });
    if (resetError) setError(resetError.message);
    else setMessage("Если аккаунт существует, ссылка для смены пароля отправлена на email.");
    setLoading(false);
  }

  return (
    <AuthShell title="Сброс пароля" description="Мы отправим одноразовую ссылку для установки нового пароля." footer={<Link className={styles.link} href="/login">Вернуться ко входу</Link>}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>Email<input className={styles.input} type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        {message && <p className={styles.message} role="status">{message}</p>}
        <button className={styles.button} type="submit" disabled={loading}>{loading ? "Отправляем…" : "Отправить ссылку"}</button>
      </form>
    </AuthShell>
  );
}
