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
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
      {
        src: "/favicon.ico",
        sizes: "256x256",
        type: "image/x-icon",
      },
    ],
  };
}
