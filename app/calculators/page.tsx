import type { Metadata } from "next";
import { AdvancedCalculators } from "@/components/advanced-calculators";

const pageUrl = "https://pyinthesky.github.io/astrophoto/calculators/";

export const metadata: Metadata = {
  title: "Astrophotography Calculators – FOV, Pixel Étendue & SNR",
  description: "Calculate camera field of view, image scale, seeing sampling, star drift, integration time, and compare pixel étendue and sky-limited SNR between two astrophotography setups.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Advanced Astrophotography Calculators",
    description: "Free field-of-view, pixel-scale, star-drift, integration, pixel-étendue, and sky-limited SNR comparison tools.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Advanced Astrophotography Calculators",
    description: "Free field-of-view, pixel-scale, star-drift, integration, pixel-étendue, and sky-limited SNR comparison tools.",
  },
};

export default function CalculatorsPage() {
  return <AdvancedCalculators />;
}
