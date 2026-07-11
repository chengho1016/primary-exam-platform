import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: siteConfig.name,
    short_name: "Exam Go",
    description: siteConfig.description,
    start_url: "/",
    display: "standalone",
    background_color: "#ffeee7",
    theme_color: "#2d2e2a",
    lang: "zh-Hant-HK",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
