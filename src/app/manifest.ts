import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Mithaq",
    short_name: "Mithaq",
    description: "Halal Islamic marriage platform for serious nikah",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#10B981",
    icons: [
      { src: "/favicon.ico", sizes: "any", type: "image/x-icon" },
    ],
  };
}
