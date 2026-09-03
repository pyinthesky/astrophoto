import { mkdir, rm, writeFile } from "node:fs/promises";

const sources = [
  "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/NGC.csv",
  "https://raw.githubusercontent.com/mattiaverga/OpenNGC/master/database_files/addendum.csv",
];

function parseCoordinate(value, rightAscension = false) {
  if (!value) return null;
  const sign = value.startsWith("-") ? -1 : 1;
  const parts = value.replace(/^[+-]/, "").split(":").map(Number);
  if (parts.length !== 3 || parts.some((part) => !Number.isFinite(part))) return null;
  const result = parts[0] + parts[1] / 60 + parts[2] / 3600;
  return Number(((rightAscension ? 1 : sign) * result).toFixed(5));
}

function displayName(name) {
  const match = /^(NGC|IC|M|C|B)(0*)(\d+)(.*)$/.exec(name);
  if (!match) return name;
  const catalog = { NGC: "NGC", IC: "IC", M: "Messier", C: "Caldwell", B: "Barnard" }[match[1]];
  return `${catalog} ${Number(match[3])}${match[4]}`;
}

function number(value) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function aliasesFor(row) {
  const aliases = [];
  if (row.M) aliases.push(`M ${Number(row.M)}`);
  if (row.NGC) row.NGC.split(",").forEach((id) => aliases.push(`NGC ${Number(id)}`));
  if (row.IC) row.IC.split(",").forEach((id) => aliases.push(`IC ${Number(id)}`));
  for (const match of row.Identifiers.matchAll(/(?:^|,)C\s+(\d{3})(?=,|$)/g)) aliases.push(`Caldwell ${Number(match[1])}`);
  if (/^C\d+$/.test(row.Name)) aliases.push(`C ${Number(row.Name.slice(1))}`);
  if (/^M\d+$/.test(row.Name)) aliases.push(`M ${Number(row.Name.slice(1))}`);
  if (row.Name === "NGC5866") aliases.push("M 102 candidate");
  return [...new Set(aliases)].join("|");
}

const rows = [];
for (const source of sources) {
  const response = await fetch(source);
  if (!response.ok) throw new Error(`Could not download ${source}: ${response.status}`);
  const lines = (await response.text()).trim().split(/\r?\n/);
  const headers = lines.shift().split(";");
  for (const line of lines) {
    const values = line.split(";");
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
    if (["NonEx", "Dup"].includes(row.Type)) continue;
    const ra = parseCoordinate(row.RA, true);
    const dec = parseCoordinate(row.Dec);
    if (ra === null || dec === null) continue;
    rows.push([
      displayName(row.Name),
      row.Type,
      ra,
      dec,
      row.Const,
      number(row.MajAx),
      number(row.MinAx),
      number(row["V-Mag"] || row["B-Mag"]),
      aliasesFor(row),
      row["Common names"],
    ]);
  }
}

rows.sort((a, b) => a[0].localeCompare(b[0], "en", { numeric: true }));
const payload = {
  generated: new Date().toISOString().slice(0, 10),
  source: "OpenNGC",
  license: "CC-BY-SA-4.0",
};

const dataDirectory = new URL("../public/data/targets/", import.meta.url);
await rm(dataDirectory, { recursive: true, force: true });
await rm(new URL("../public/data/targets.json", import.meta.url), { force: true });
await mkdir(dataDirectory, { recursive: true });

const shardCount = 8;
const shardSize = Math.ceil(rows.length / shardCount);
const files = [];
for (let index = 0; index < shardCount; index += 1) {
  const file = `targets-${index + 1}.json`;
  const objects = rows.slice(index * shardSize, (index + 1) * shardSize);
  files.push(file);
  await writeFile(new URL(file, dataDirectory), JSON.stringify(objects));
}
await writeFile(new URL("index.json", dataDirectory), JSON.stringify({ ...payload, count: rows.length, files }));
console.log(`Wrote ${rows.length.toLocaleString()} target records across ${files.length} shards.`);
