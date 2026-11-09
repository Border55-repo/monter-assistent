import type { CalcInput, Kind } from "../lib/types";
import { format, numberFrom } from "../lib/types";
export function Diagram({ input, kind }: { input: CalcInput; kind: Kind }) {
  const l = numberFrom(input.values.length),
    h = numberFrom(input.values.width);
  if (!Number.isFinite(l) || !Number.isFinite(h) || l <= 0 || h <= 0)
    return null;
  const isDeck = kind === "deck",
    aspect = Math.min(4, Math.max(0.4, l / h));
  const w = aspect >= 1 ? 330 : 200 * aspect,
    height = aspect >= 1 ? 330 / aspect : 200,
    x = (440 - w) / 2,
    y = (260 - height) / 2 + 12;
  const cc = numberFrom(input.values.cc || "600") / 1000,
    gridCount = Math.min(60, Math.max(1, Math.ceil(l / (cc > 0 ? cc : 0.6))));
  const horizontal = isDeck
    ? input.values.direction !== "width"
    : input.values.direction === "horizontal";
  return (
    <figure className="diagram">
      <svg
        viewBox="0 0 440 305"
        role="img"
        aria-label={
          isDeck
            ? `Terrasseskisse ${format(l)} ganger ${format(h)} meter`
            : `Flateskisse ${format(l)} ganger ${format(h)} meter med åpninger`
        }
      >
        <defs>
          <pattern
            id={`grid-${kind}`}
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="0.7" fill="currentColor" opacity=".16" />
          </pattern>
          <pattern
            id={`fill-${kind}`}
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M-2 2 2-2M0 10 10 0M8 12 12 8"
              stroke="currentColor"
              strokeWidth=".8"
              opacity=".15"
            />
          </pattern>
        </defs>
        <rect width="440" height="305" fill={`url(#grid-${kind})`} />
        <rect
          x={x}
          y={y}
          width={w}
          height={height}
          fill={isDeck ? "#c4ad89" : "#e8d5a1"}
          stroke="#73765b"
          strokeWidth="2"
        />
        <rect
          x={x}
          y={y}
          width={w}
          height={height}
          fill={`url(#fill-${kind})`}
        />
        {Array.from({ length: isDeck ? 17 : gridCount - 1 }, (_, i) =>
          isDeck ? (
            <line
              key={i}
              x1={horizontal ? x : x + ((i + 1) * w) / 18}
              x2={horizontal ? x + w : x + ((i + 1) * w) / 18}
              y1={horizontal ? y + ((i + 1) * height) / 18 : y}
              y2={horizontal ? y + ((i + 1) * height) / 18 : y + height}
              stroke="#6f735b"
              strokeWidth="1"
            />
          ) : (
            <rect
              key={i}
              x={x + ((i + 1) * w) / gridCount - 2}
              y={y}
              width="4"
              height={height}
              fill="#8d987a"
            />
          ),
        )}
        {!isDeck &&
          input.openings.slice(0, 20).map((o) => {
            const ow = numberFrom(o.width),
              oh = numberFrom(o.height),
              ox = numberFrom(o.x),
              oy = numberFrom(o.y);
            if (
              ![ow, oh, ox, oy].every(Number.isFinite) ||
              ow <= 0 ||
              oh <= 0 ||
              ox < 0 ||
              oy < 0 ||
              ox + ow > l ||
              oy + oh > h
            )
              return null;
            return (
              <g key={o.id}>
                <rect
                  x={x + (ox / l) * w}
                  y={y + height - ((oy + oh) / h) * height}
                  width={(ow / l) * w}
                  height={(oh / h) * height}
                  fill="var(--surface)"
                  stroke="#51665a"
                  strokeWidth="1.8"
                />
                <text
                  x={x + ((ox + ow / 2) / l) * w}
                  y={y + height - ((oy + oh / 2) / h) * height}
                  textAnchor="middle"
                  fontSize="9"
                  fill="currentColor"
                >
                  {o.name.slice(0, 10)}
                </text>
              </g>
            );
          })}
        <path
          d={`M${x} ${y - 14}v-10m0 5h${w}m0 -5v10`}
          fill="none"
          stroke="currentColor"
          opacity=".5"
        />
        <text
          x="220"
          y={y - 27}
          textAnchor="middle"
          fontSize="12"
          fill="currentColor"
        >
          {format(l)} m
        </text>
        <path
          d={`M${x + w + 14} ${y}h10m-5 0v${height}m-5 0h10`}
          fill="none"
          stroke="currentColor"
          opacity=".5"
        />
        <text
          x={x + w + 33}
          y={y + height / 2}
          textAnchor="middle"
          fontSize="12"
          fill="currentColor"
          transform={`rotate(90 ${x + w + 33} ${y + height / 2})`}
        >
          {format(h)} m
        </text>
        <text
          x="220"
          y="292"
          textAnchor="middle"
          fontSize="10"
          fill="currentColor"
          opacity=".65"
        >
          {isDeck
            ? "Prinsippskisse · ikke en skjøte- eller bjelkeplan"
            : "Prinsippskisse · ett eksemplar per åpningstype"}
        </text>
      </svg>
      <figcaption>
        {isDeck ? "Leggeretning og mål" : "Flate med mål og fradrag"}
        <span>Oppdateres mens du skriver</span>
      </figcaption>
    </figure>
  );
}
export function HouseIllustration() {
  return (
    <svg
      className="house-art"
      viewBox="0 0 420 270"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <pattern
          id="hero-grid"
          width="26"
          height="26"
          patternUnits="userSpaceOnUse"
        >
          <path d="M26 0H0v26" stroke="#93b0a0" strokeOpacity=".1" />
        </pattern>
      </defs>
      <rect width="420" height="270" fill="url(#hero-grid)" />
      <path d="m69 188 154 68 158-88-151-65z" fill="#335449" />
      <path d="m90 129 131 58v62L90 190z" fill="#49695a" />
      <path d="m221 187 129-73v63l-129 72z" fill="#244538" />
      <path d="m80 128 146-99 135 86-140 80z" fill="#6d8874" />
      <path d="m80 128 146-99 3 9-134 96z" fill="#c3ccb0" />
      <path d="m226 29 135 86-140 80 8-157z" fill="#506e5c" />
      <path d="m250 54 83 53-94 55z" fill="#3c5b4c" stroke="#7f9a80" />
      <path d="m138 151 43 19v47l-43-19z" fill="#283f36" />
      <path d="m145 163 29 13v29l-29-13z" fill="#e4aa68" />
      <path d="m248 184 74-42v36l-74 42z" fill="#112d24" />
      <path d="m253 187 64-36v22l-64 36z" fill="#b3c2a3" />
      <path
        d="m253 197 64-36m-43 15v23m22-36v23"
        stroke="#496756"
        strokeWidth="2"
      />
      <path
        d="m78 212 145 64m4 0 144-81M67 216l10-12m140 77 11-12m5 12-11-12m152-68-10-12"
        stroke="#aac0a7"
        strokeWidth="1.4"
      />
      <path
        d="m51 163 28-16m-28-39 28-16M59 104v54m-14-52 14-7 7 4m-21 63 14-7 7 4"
        stroke="#ee9b5c"
        strokeWidth="1.4"
      />
      <circle cx="350" cy="62" r="25" stroke="#7d9c83" strokeDasharray="3 4" />
      <path d="m340 62 7 7 13-15" stroke="#e7a26b" strokeWidth="2" />
      <text
        x="120"
        y="248"
        fill="#b3c7b3"
        fontSize="10"
        transform="rotate(24 120 248)"
      >
        Riktige mål. Bedre oversikt.
      </text>
    </svg>
  );
}
