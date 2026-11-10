import { Plus, Trash2 } from "lucide-react";
import type { CalcInput, Opening } from "../lib/types";
import { uid } from "../lib/types";
import { Field } from "./ui";
type Wall = NonNullable<CalcInput["walls"]>[number];
export function WallEditor({
  input,
  onChange,
}: {
  input: CalcInput;
  onChange: (v: CalcInput) => void;
}) {
  const walls = input.walls || [];
  const update = (id: string, patch: Partial<Wall>) =>
    onChange({
      ...input,
      walls: walls.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    });
  return (
    <div className="wall-list">
      <p className="small muted">
        Egne mål og åpninger for hver vegg. Produkt og øvrige valg er felles.
        For trelast gjelder tillegg og svillvalg per vegg, med separat
        avrunding.
      </p>
      {walls.map((w, i) => (
        <section className="wall-card" key={w.id} aria-label={`Vegg ${i + 1}`}>
          <div className="opening-title">
            <input
              aria-label={`Navn på vegg ${i + 1}`}
              maxLength={100}
              value={w.name}
              onChange={(e) => update(w.id, { name: e.target.value })}
            />
            <button
              className="icon-button danger"
              aria-label={`Fjern vegg ${i + 1}`}
              disabled={walls.length === 1}
              onClick={() =>
                onChange({
                  ...input,
                  walls: walls.filter((x) => x.id !== w.id),
                })
              }
            >
              <Trash2 size={17} />
            </button>
          </div>
          <div className="fields-grid">
            <Field
              label={`Lengde vegg ${i + 1}`}
              value={w.length}
              unit="m"
              onChange={(length) => update(w.id, { length })}
            />
            <Field
              label={`Høyde vegg ${i + 1}`}
              value={w.height}
              unit="m"
              onChange={(height) => update(w.id, { height })}
            />
          </div>
          <div className="section-heading minor">
            <h3>Dører og vinduer · vegg {i + 1}</h3>
            <button
              className="small-button"
              onClick={() =>
                update(w.id, {
                  openings: [
                    ...w.openings,
                    {
                      id: uid(),
                      name: `Åpning ${w.openings.length + 1}`,
                      width: "",
                      height: "",
                      count: "1",
                      x: "0",
                      y: "0",
                    },
                  ],
                })
              }
            >
              <Plus size={15} /> Legg til åpning
            </button>
          </div>
          {w.openings.map((o, j) => (
            <div className="opening-card" key={o.id}>
              <div className="opening-title">
                <strong>Åpning {j + 1}</strong>
                <button
                  className="icon-button danger"
                  aria-label={`Fjern åpning ${j + 1} vegg ${i + 1}`}
                  onClick={() =>
                    update(w.id, {
                      openings: w.openings.filter((x) => x.id !== o.id),
                    })
                  }
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div className="fields-grid three">
                {(["width", "height", "count", "x", "y"] as const).map((k) => (
                  <Field
                    key={k}
                    label={`${({ width: "Bredde", height: "Høyde", count: "Antall", x: "Fra venstre", y: "Fra gulvet" } as Record<keyof Omit<Opening, "id" | "name">, string>)[k]} åpning ${j + 1} vegg ${i + 1}`}
                    value={o[k]}
                    unit={k === "count" ? "stk" : "m"}
                    onChange={(s) =>
                      update(w.id, {
                        openings: w.openings.map((x) =>
                          x.id === o.id ? { ...x, [k]: s } : x,
                        ),
                      })
                    }
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      ))}
      <button
        className="secondary full"
        disabled={walls.length >= 50}
        onClick={() =>
          onChange({
            ...input,
            walls: [
              ...walls,
              {
                id: uid(),
                name: `Vegg ${walls.length + 1}`,
                length: "",
                height: walls.at(-1)?.height || "",
                openings: [],
              },
            ],
          })
        }
      >
        <Plus size={17} /> Legg til vegg
      </button>
    </div>
  );
}
