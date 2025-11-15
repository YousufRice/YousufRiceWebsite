import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Yousuf Rice - Premium Quality Rice Delivery",
    short_name: "Yousuf Rice",
    description:
      "Order premium quality basmati and sella rice online with tier-based pricing, free delivery, and cash on delivery",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#27247b",
    icons: [
      {
        src: "/logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
