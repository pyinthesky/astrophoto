import type { Metadata } from "next";
import { CameraCatalog } from "@/components/camera-catalog";

const pageUrl = "https://pyinthesky.github.io/astrophoto/cameras/";

export const metadata: Metadata = {
  title: "Astrophotography Camera & Sensor Database",
  description: "Search camera sensor sizes, native resolutions, pixel pitch, megapixels, and color or monochrome astronomy-camera profiles.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Astrophotography Camera & Sensor Database",
    description: "Look up the sensor specifications used by Astro NPF's exposure and image-scale calculators.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Astrophotography Camera & Sensor Database",
    description: "Search camera sensor size, resolution, and pixel pitch for astrophotography.",
  },
};

export default function CamerasPage() {
  return <CameraCatalog />;
}
