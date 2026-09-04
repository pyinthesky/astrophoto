import type { Metadata } from "next";
import { SunMoonCalendar } from "@/components/sun-moon-calendar";

const pageUrl = "https://pyinthesky.github.io/astrophoto/sun-moon-calendar/";

export const metadata: Metadata = {
  title: "Sun and Moon Calendar for Astrophotography",
  description: "Monthly Moon phases, illumination, moonrise, moonset, sunrise, sunset, twilight, astronomical darkness, and moonless observing hours for any location.",
  alternates: { canonical: pageUrl },
  openGraph: {
    url: pageUrl,
    title: "Sun and Moon Calendar for Astrophotography",
    description: "Compare Moon light, twilight, and moonless darkness to choose a better night for astrophotography.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Sun and Moon Calendar for Astrophotography",
    description: "Compare Moon light, twilight, and moonless darkness to choose a better night for astrophotography.",
  },
};

export default function SunMoonCalendarPage() {
  return <SunMoonCalendar initialDate={new Date().toISOString().slice(0, 10)} />;
}
