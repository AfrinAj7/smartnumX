import type { MetadataRoute } from "next";
import { getAllCourseSlugs } from "@/server/courses";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://smartnumx.com";
  const courseSlugs = await getAllCourseSlugs();

  const staticRoutes: MetadataRoute.Sitemap = [
    "",
    "/about",
    "/batches",
    "/test-series",
    "/policies/terms",
    "/policies/privacy",
    "/policies/refund",
    "/policies/child-safety",
  ].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: route === "" ? 1.0 : route === "/batches" ? 0.9 : 0.8,
  }));

  const courseRoutes: MetadataRoute.Sitemap = courseSlugs.map((slug) => ({
    url: `${siteUrl}/batches/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));

  return [...staticRoutes, ...courseRoutes];
}
