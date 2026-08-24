import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Vertical Bot",
    short_name: "Vertical Bot",
    description:
      "Ask about humanoid robots — Atlas, Optimus, Figure 01, ASIMO, Ameca and Unitree H1.",
    start_url: "/",
    display: "standalone",
    background_color: "#05070f",
    theme_color: "#05070f",
    icons: [
      // "any" carries its own rounded corners, so it is shown as drawn.
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      // "maskable" is full-bleed with the mark inset, because the launcher
      // crops to its own shape and anything near a corner is lost.
      { src: "/icon-192-maskable.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-512-maskable.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
