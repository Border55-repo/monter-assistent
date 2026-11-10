import type { AppData, MaterialLine } from "./types";
import { kinds, projectStatuses } from "./types";
import { validateProduct } from "./products";
export function validateBackup(value: unknown): AppData {
  const fail = () => {
    throw new Error("Ugyldig sikkerhetskopi. Eksisterende data er beholdt.");
  };
  if (!value || typeof value !== "object") return fail();
  const data = value as AppData;
  if (
    data.schemaVersion !== 1 ||
    !Array.isArray(data.products) ||
    !Array.isArray(data.projects) ||
    !Array.isArray(data.favorites) ||
    !Array.isArray(data.recent) ||
    !data.drafts ||
    typeof data.drafts !== "object" ||
    data.products.length > 10000 ||
    data.projects.length > 10000 ||
    !["light", "dark"].includes(data.theme) ||
    typeof data.activeProjectId !== "string"
  )
    return fail();
  for (const p of data.products) {
    if (typeof p.id !== "string") return fail();
    validateProduct(p as unknown as Record<string, unknown>);
  }
  const lineValid = (l: MaterialLine) =>
    l &&
    ["id", "name", "sku", "dimension", "unit", "priceSource", "note"].every(
      (k) => typeof l[k as keyof MaterialLine] === "string",
    ) &&
    Number.isFinite(l.quantity) &&
    l.quantity > 0 &&
    (l.price === undefined || (Number.isFinite(l.price) && l.price >= 0));
  const inputValid = (input: AppData["drafts"][(typeof kinds)[number]]) =>
    input &&
    input.values &&
    Object.values(input.values).every((v) => typeof v === "string") &&
    Array.isArray(input.openings) &&
    input.openings.every(
      (o) =>
        o &&
        ["id", "name", "width", "height", "count", "x", "y"].every(
          (k) => typeof o[k as keyof typeof o] === "string",
        ),
    ) &&
    Array.isArray(input.rooms) &&
    input.rooms.every(
      (r) =>
        r &&
        ["id", "name", "length", "width", "doorWidth"].every(
          (k) => typeof r[k as keyof typeof r] === "string",
        ),
    ) &&
    (input.walls === undefined ||
      (Array.isArray(input.walls) &&
        input.walls.length <= 50 &&
        input.walls.every(
          (w) =>
            w &&
            [w.id, w.name, w.length, w.height].every(
              (s) => typeof s === "string",
            ) &&
            Array.isArray(w.openings) &&
            w.openings.every(
              (o) =>
                o &&
                [o.id, o.name, o.width, o.height, o.count, o.x, o.y].every(
                  (s) => typeof s === "string",
                ),
            ),
        )));
  for (const [kind, input] of Object.entries(data.drafts))
    if (!kinds.includes(kind as (typeof kinds)[number]) || !inputValid(input))
      return fail();
  for (const p of data.projects) {
    if (
      !p ||
      typeof p.id !== "string" ||
      typeof p.name !== "string" ||
      !Number.isFinite(Date.parse(p.createdAt)) ||
      !Number.isFinite(Date.parse(p.updatedAt)) ||
      !Array.isArray(p.lines) ||
      !p.lines.every(lineValid) ||
      !Array.isArray(p.calculations) ||
      (p.status !== undefined && !Object.hasOwn(projectStatuses, p.status)) ||
      (p.workNote !== undefined &&
        (typeof p.workNote !== "string" || p.workNote.length > 500))
    )
      return fail();
    for (const c of p.calculations)
      if (
        !c ||
        typeof c.id !== "string" ||
        !kinds.includes(c.kind) ||
        !Number.isFinite(Date.parse(c.createdAt)) ||
        !inputValid(c.input) ||
        !c.result ||
        !Array.isArray(c.result.lines) ||
        !c.result.lines.every(lineValid) ||
        !["warnings", "related", "assumptions"].every(
          (k) =>
            Array.isArray(c.result[k as "warnings"]) &&
            c.result[k as "warnings"].every((s) => typeof s === "string"),
        ) ||
        !Array.isArray(c.result.metrics) ||
        !c.result.metrics.every(
          (m) =>
            typeof m.label === "string" &&
            typeof m.unit === "string" &&
            Number.isFinite(m.value),
        )
      )
        return fail();
  }
  if (data.locations !== undefined) {
    if (
      !data.locations ||
      typeof data.locations !== "object" ||
      Array.isArray(data.locations) ||
      Object.keys(data.locations).length > 10000
    )
      return fail();
    for (const l of Object.values(data.locations))
      if (
        !l ||
        ![l.area, l.rack, l.shelf].every(
          (s) => typeof s === "string" && s.length <= 100,
        ) ||
        !Number.isFinite(Date.parse(l.checkedAt))
      )
        return fail();
  }
  if (
    data.catalogRevision !== undefined &&
    (!Number.isInteger(data.catalogRevision) || data.catalogRevision < 0)
  )
    return fail();
  if (
    data.favorites.some((k) => !kinds.includes(k)) ||
    data.recent.some(
      (r) => !kinds.includes(r.kind) || !Number.isFinite(Date.parse(r.date)),
    ) ||
    new Set(data.projects.map((p) => p.id)).size !== data.projects.length ||
    new Set(data.products.map((p) => p.id)).size !== data.products.length
  )
    return fail();
  return data;
}
