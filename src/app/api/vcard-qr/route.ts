import QRCode from "qrcode";
import { buildVCard } from "@/lib/contact";

export const runtime = "nodejs";

export async function GET() {
  const vcf = buildVCard();

  const pngBuffer = await QRCode.toBuffer(vcf, {
    type: "png",
    errorCorrectionLevel: "M",
    margin: 2,
    scale: 8,
  });

  return new Response(pngBuffer, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "no-store",
    },
  });
}
