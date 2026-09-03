import type { Metadata } from "next";
import { SkyPlanner } from "@/components/sky-planner";

const pageUrl = "https://pyinthesky.github.io/astrophoto/sky-planner/";

export const metadata: Metadata = {
  title: "Milky Way & Night Sky Planner",
  description: "Use your location and any date or time to find the Milky Way core, bright stars, astronomical darkness, Moon conditions, clouds, wind, and dew risk for astrophotography.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Milky Way & Night Sky Planner",
    description: "Find the Milky Way, dark-sky hours, Moon conditions, clouds, wind, and dew risk from your location.",
  },
};

export default function SkyPlannerPage() {
  return <SkyPlanner />;
}
