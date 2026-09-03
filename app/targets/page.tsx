import type { Metadata } from "next";
import { TargetCatalog } from "@/components/target-catalog";

const pageUrl = "https://pyinthesky.github.io/astrophoto/targets/";

export const metadata: Metadata = {
  title: "Deep-Sky Object Catalogue – Messier, NGC, IC & Caldwell",
  description: "Search more than 13,000 galaxies, nebulae, and star clusters by Messier, Caldwell, NGC, IC, or common name, with coordinates, size, and magnitude.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Deep-Sky Object Catalogue",
    description: "Search Messier, Caldwell, NGC, and IC targets for your next astrophotography session.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Deep-Sky Object Catalogue",
    description: "Search Messier, Caldwell, NGC, and IC astrophotography targets.",
  },
};

export default function TargetsPage() {
  return <TargetCatalog />;
}
