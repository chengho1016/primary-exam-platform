import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/site-config";

const publicRoutes = ["", "/papers", "/pricing", "/contact", "/login", "/register", "/privacy", "/terms"] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  return publicRoutes.map((route, index) => ({
    url: `${siteConfig.url}${route}`,
    lastModified,
    changeFrequency: index === 0 || route === "/papers" ? "weekly" : "monthly",
    priority: index === 0 ? 1 : route === "/papers" ? 0.9 : 0.6,
  }));
}
