import type { Metadata } from "next";
import { SkyPlanner } from "@/components/sky-planner";

const pageUrl = "https://pyinthesky.github.io/astrophoto/sky-planner/";

export const metadata: Metadata = {
  title: "Milky Way & Night Sky Planner",
  description: "Use your location and any date or time to find the Milky Way core, bright stars, astronomical darkness, and Moon conditions for astrophotography.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Milky Way & Night Sky Planner",
    description: "Find the Milky Way, bright stars, dark-sky hours, and Moon conditions from your location.",
  },
};

export default function SkyPlannerPage() {
  return <SkyPlanner />;
}
