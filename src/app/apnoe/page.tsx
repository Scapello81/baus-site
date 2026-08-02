import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";

export default async function ApnoePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        padding: "32px",
      }}
    >
      <h1>Тренировки по статическому апноэ</h1>

      <p>Пользователь: {user.email}</p>

      <p>Текущий рекорд: 2:38</p>
    </main>
  );
}