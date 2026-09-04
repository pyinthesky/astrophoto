export type TargetTuple = [
  name: string,
  type: string,
  rightAscension: number,
  declination: number,
  constellation: string,
  majorAxis: number | null,
  minorAxis: number | null,
  magnitude: number | null,
  aliases: string,
  commonNames: string,
];

export type TargetCatalogPayload = {
  generated: string;
  source: string;
  license: string;
  count: number;
  files: string[];
  objects: TargetTuple[];
};

export function normalizeTargetSearch(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function targetSearchText(target: TargetTuple) {
  return normalizeTargetSearch(`${target[0]} ${target[8]} ${target[9]}`);
}

export async function loadTargetCatalog() {
  const base = new URL("../data/targets/", window.location.href);
  const indexResponse = await fetch(new URL("index.json", base));
  if (!indexResponse.ok) throw new Error("Catalogue unavailable");
  const index = await indexResponse.json() as Omit<TargetCatalogPayload, "objects">;
  const responses = await Promise.all(index.files.map((file) => fetch(new URL(file, base))));
  if (responses.some((response) => !response.ok)) throw new Error("Catalogue shard unavailable");
  const shards = await Promise.all(responses.map((response) => response.json() as Promise<TargetTuple[]>));
  return { ...index, objects: shards.flat() };
}

export const targetTypeLabels: Record<string, string> = {
  "*": "Star",
  "**": "Double star",
  "*Ass": "Star association",
  OCl: "Open cluster",
  GCl: "Globular cluster",
  "Cl+N": "Cluster + nebula",
  G: "Galaxy",
  GPair: "Galaxy pair",
  GTrpl: "Galaxy triplet",
  GGroup: "Galaxy group",
  PN: "Planetary nebula",
  HII: "H II region",
  DrkN: "Dark nebula",
  EmN: "Emission nebula",
  Neb: "Nebula",
  RfN: "Reflection nebula",
  SNR: "Supernova remnant",
  Nova: "Nova",
  Other: "Other",
};

export function formatRightAscension(hours: number) {
  const h = Math.floor(hours);
  const minutes = (hours - h) * 60;
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
}

export function formatDeclination(value: number) {
  const absolute = Math.abs(value);
  const degrees = Math.floor(absolute);
  const minutes = Math.round((absolute - degrees) * 60);
  return `${value >= 0 ? "+" : "−"}${String(degrees).padStart(2, "0")}° ${String(minutes).padStart(2, "0")}′`;
}

export function targetFamily(type: string) {
  if (["G", "GPair", "GTrpl", "GGroup"].includes(type)) return "galaxy";
  if (["Neb", "HII", "DrkN", "EmN", "RfN", "SNR"].includes(type)) return "nebula";
  if (["OCl", "GCl", "*Ass", "Cl+N"].includes(type)) return "cluster";
  if (type === "PN") return "planetary";
  return "other";
}
