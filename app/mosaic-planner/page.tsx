import type { Metadata } from "next";
import { MosaicPlanner } from "@/components/mosaic-planner";

const pageUrl = "https://pyinthesky.github.io/astrophoto/mosaic-planner/";

export const metadata: Metadata = {
  title: "Astrophotography Mosaic Planner",
  description: "Plan an overlapping astrophotography mosaic from camera sensor size, focal length, target dimensions, rotation, margin, and integration time.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Astrophotography Mosaic Planner",
    description: "Calculate panel count, overlap, stitched field of view, session time, and approximate J2000 panel centers.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Astrophotography Mosaic Planner",
    description: "Turn a camera, focal length, and target into a practical mosaic panel sequence.",
  },
};

export default function MosaicPlannerPage() {
  return <MosaicPlanner />;
}
