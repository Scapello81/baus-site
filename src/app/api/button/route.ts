export async function POST() {
  const url = process.env.HA_WEBHOOK_URL;

  if (!url) {
    return new Response("HA_WEBHOOK_URL missing", { status: 500 });
  }

  const r = await fetch(url, { method: "POST" });

  if (!r.ok) {
    return new Response(`HA webhook failed: ${r.status}`, { status: 502 });
  }

  return new Response("ok", { status: 200 });
}
