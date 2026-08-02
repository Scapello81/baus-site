import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import ApneaDashboard from "./components/ApneaDashboard";

export default async function ApnoePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return <ApneaDashboard userId={user.id} userEmail={user.email ?? ""} />;
}
