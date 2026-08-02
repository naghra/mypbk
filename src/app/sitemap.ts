import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/utils";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: absoluteUrl("/"), changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/login"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/register"), changeFrequency: "monthly", priority: 0.8 },
  ];
}
