import type { Metadata } from "next";
import { TripPlanner } from "@/components/trip-planner";

const pageUrl = "https://pyinthesky.github.io/astrophoto/trip-planner/";

export const metadata: Metadata = {
  title: "Astrophotography Trip Planner",
  description: "Choose a Milky Way or deep-sky target, rank promising nights by darkness and Moon conditions, and find nearby outdoor areas to scout for an astrophotography trip.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Astrophotography Trip Planner",
    description: "Find promising dates and nearby areas to scout for your next Milky Way or deep-sky photography trip.",
  },
};

export default function TripPlannerPage() {
  return <TripPlanner />;
}
