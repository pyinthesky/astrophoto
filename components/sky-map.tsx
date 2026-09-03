import type { HorizontalTarget } from "@/lib/sky";

type PlanePoint = { altitude: number; azimuth: number };

function project(altitude: number, azimuth: number) {
  const radius = ((90 - Math.max(0, altitude)) / 90) * 164;
  const angle = (azimuth * Math.PI) / 180;
  return {
    x: 200 + radius * Math.sin(angle),
    y: 200 - radius * Math.cos(angle),
  };
}

function planePath(points: PlanePoint[]) {
  let drawing = false;
  return points.map((point) => {
    if (point.altitude < 0) {
      drawing = false;
      return "";
    }
    const projected = project(point.altitude, point.azimuth);
    const command = drawing ? "L" : "M";
    drawing = true;
    return `${command}${projected.x.toFixed(1)},${projected.y.toFixed(1)}`;
  }).join(" ");
}

export function SkyMap({
  targets,
  plane,
  moon,
  selectedId,
  onSelect,
}: {
  targets: HorizontalTarget[];
  plane: PlanePoint[];
  moon: { altitude: number; azimuth: number };
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const visibleTargets = targets.filter((target) => target.altitude >= 0);
  const selected = targets.find((target) => target.id === selectedId);
  const moonPoint = project(moon.altitude, moon.azimuth);
  const path = planePath(plane);

  return (
    <div className="sky-map-wrap">
      <svg className="sky-map" viewBox="0 0 400 400" role="img" aria-label="All-sky compass map">
        <defs>
          <radialGradient id="sky-fill">
            <stop offset="0" stopColor="#153342" />
            <stop offset="1" stopColor="#08151d" />
          </radialGradient>
        </defs>
        <circle cx="200" cy="200" r="166" fill="url(#sky-fill)" stroke="#33505c" strokeWidth="2" />
        <circle cx="200" cy="200" r="110.7" fill="none" stroke="#223946" strokeDasharray="3 5" />
        <circle cx="200" cy="200" r="55.3" fill="none" stroke="#223946" strokeDasharray="3 5" />
        <line x1="34" y1="200" x2="366" y2="200" stroke="#1a303b" />
        <line x1="200" y1="34" x2="200" y2="366" stroke="#1a303b" />
        <text x="200" y="22" textAnchor="middle">N</text>
        <text x="382" y="205" textAnchor="middle">E</text>
        <text x="200" y="392" textAnchor="middle">S</text>
        <text x="18" y="205" textAnchor="middle">W</text>
        <text x="205" y="93" className="altitude-label">30°</text>
        <text x="205" y="147" className="altitude-label">60°</text>
        {path && <>
          <path d={path} fill="none" stroke="rgba(126,105,189,.18)" strokeWidth="25" strokeLinecap="round" />
          <path d={path} fill="none" stroke="rgba(187,162,255,.52)" strokeWidth="2" strokeLinecap="round" />
        </>}
        {visibleTargets.map((target) => {
          const point = project(target.altitude, target.azimuth);
          const radius = target.kind === "milky-way" ? 6 : Math.max(2.1, 4.4 - target.magnitude);
          const selectedTarget = selectedId === target.id;
          return (
            <g
              key={target.id}
              className="sky-target"
              role="button"
              tabIndex={0}
              aria-label={`Select ${target.name}`}
              onClick={() => onSelect(target.id)}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onSelect(target.id); }}
            >
              {selectedTarget && <circle cx={point.x} cy={point.y} r={11} fill="none" stroke="#ffb45c" strokeWidth="1.5" />}
              <circle cx={point.x} cy={point.y} r={radius} fill={target.kind === "milky-way" ? "#ffb45c" : "#eefbff"} />
              {(target.magnitude < 0.9 || target.kind === "milky-way" || selectedTarget) &&
                <text x={point.x + 7} y={point.y - 7}>{target.name}</text>}
            </g>
          );
        })}
        {moon.altitude >= 0 && <>
          <circle cx={moonPoint.x} cy={moonPoint.y} r="7" fill="#f1e8c9" />
          <text x={moonPoint.x + 10} y={moonPoint.y - 9}>Moon</text>
        </>}
        {selected && selected.altitude < 0 && <text x="200" y="205" textAnchor="middle" className="below-note">Selected target is below the horizon</text>}
      </svg>
      <div className="map-legend"><span><i className="legend-band" /> Milky Way plane</span><span><i className="legend-dot" /> Bright stars</span></div>
    </div>
  );
}
