import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import LoginForm from "./LoginForm";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/apnoe");
  const { error } = await searchParams;
  const initialError = error === "auth"
    ? "Ссылка недействительна или устарела. Запроси новую ссылку."
    : "";
  return <LoginForm initialError={initialError} />;
}
