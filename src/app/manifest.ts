import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BAUS Training",
    short_name: "BAUS",
    description: "Тренировки статического апноэ, планы и история прогресса",
    start_url: "/apnoe",
    scope: "/",
    display: "standalone",
    background_color: "#0b1018",
    theme_color: "#0b1018",
    orientation: "portrait",
    lang: "ru",
    categories: ["health", "fitness", "sports"],
    icons: [
      {
        src: "/pwa-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/pwa-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
