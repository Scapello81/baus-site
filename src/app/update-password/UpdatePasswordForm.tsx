"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import AuthShell from "@/app/auth/AuthShell";
import styles from "@/app/auth/auth.module.css";
import { createClient } from "@/lib/supabase-browser";

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (password.length < 8) { setError("Пароль должен содержать не менее 8 символов."); return; }
    if (password !== confirmation) { setError("Пароли не совпадают."); return; }

    setLoading(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) { setError(updateError.message); setLoading(false); return; }
    router.replace("/apnoe");
    router.refresh();
  }

  return (
    <AuthShell title="Новый пароль" description="Придумай новый пароль для своего аккаунта.">
      <form className={styles.form} onSubmit={handleSubmit}>
        <label className={styles.field}>Новый пароль<input className={styles.input} type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
        <label className={styles.field}>Повтори пароль<input className={styles.input} type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
        {error && <p className={styles.error} role="alert">{error}</p>}
        <button className={styles.button} type="submit" disabled={loading}>{loading ? "Сохраняем…" : "Сохранить пароль"}</button>
      </form>
    </AuthShell>
  );
}
