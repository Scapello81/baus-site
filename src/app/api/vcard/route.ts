import { buildVCard, CONTACT } from "@/lib/contact";

export const runtime = "nodejs";

export async function GET() {
  const vcf = buildVCard();

  return new Response(vcf, {
    headers: {
      "Content-Type": "text/vcard; charset=utf-8",
      "Content-Disposition": `attachment; filename="${CONTACT.firstName}-${CONTACT.lastName}.vcf"`,
      "Cache-Control": "no-store",
    },
  });
}
