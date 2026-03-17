import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Globe Land Intelligence",
    short_name: "Globe Land",
    description: "Parcel-aware land intelligence with verified pricing and legal-display controls.",
    start_url: "/",
    display: "standalone",
    background_color: "#020817",
    theme_color: "#020817"
  };
}
