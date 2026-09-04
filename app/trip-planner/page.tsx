import type { Metadata } from "next";
import { TripPlanner } from "@/components/trip-planner";

const pageUrl = "https://pyinthesky.github.io/astrophoto/trip-planner/";

export const metadata: Metadata = {
  title: "Astrophotography Trip Planner",
  description: "Discover deep-sky targets for your location and date, rank promising nights by darkness and Moon conditions, and find nearby outdoor areas to scout for an astrophotography trip.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Astrophotography Trip Planner",
    description: "Find tonight’s best deep-sky targets, promising dates, and nearby areas to scout for your next astrophotography trip.",
  },
};

export default function TripPlannerPage() {
  return <TripPlanner />;
}
