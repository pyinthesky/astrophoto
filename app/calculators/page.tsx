import type { Metadata } from "next";
import { AdvancedCalculators } from "@/components/advanced-calculators";

const pageUrl = "https://pyinthesky.github.io/astrophoto/calculators/";

export const metadata: Metadata = {
  title: "Astrophotography Calculators – FOV, Pixel Scale & Integration",
  description: "Calculate camera field of view, image scale, seeing sampling, untracked star drift in pixels, and total integration time for an astrophotography session.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Advanced Astrophotography Calculators",
    description: "Free field-of-view, pixel-scale, star-drift, sampling, and integration planning tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Advanced Astrophotography Calculators",
    description: "Free field-of-view, pixel-scale, star-drift, sampling, and integration planning tools.",
  },
};

export default function CalculatorsPage() {
  return <AdvancedCalculators />;
}
