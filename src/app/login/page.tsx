"use client";

import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase-browser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setMessage(`Ошибка: ${error.message}`);
    } else {
      setMessage("Ссылка для входа отправлена на email.");
    }

    setLoading(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
      }}
    >
      <form
        onSubmit={handleLogin}
        style={{
          width: "100%",
          maxWidth: "420px",
          display: "grid",
          gap: "16px",
          padding: "24px",
          border: "1px solid #ccc",
          borderRadius: "16px",
        }}
      >
        <h1 style={{ margin: 0 }}>Вход</h1>

        <p style={{ margin: 0 }}>
          Введи email. Supabase отправит ссылку для входа без пароля.
        </p>

        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="email@example.com"
          style={{
            padding: "12px",
            borderRadius: "10px",
            border: "1px solid #aaa",
          }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "12px",
            border: 0,
            borderRadius: "10px",
            cursor: "pointer",
          }}
        >
          {loading ? "Отправка..." : "Получить ссылку для входа"}
        </button>

        {message && <p style={{ margin: 0 }}>{message}</p>}
      </form>
    </main>
  );
}