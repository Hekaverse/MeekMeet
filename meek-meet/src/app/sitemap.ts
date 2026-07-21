import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://meekmeet.com";
  const routes = [
    "",
    "/about",
    "/circles",
    "/login",
    "/shepherd",
    "/shepherd/apply",
    "/voice",
    "/privacy",
    "/terms",
    "/delete-account",
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
  }));
}
