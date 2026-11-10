import { openDB } from "idb";
import type { AppData } from "./types";
import { seedProducts, catalogAdditions, catalogRevision } from "./seed";
export const emptyData = (): AppData => ({
  schemaVersion: 1,
  products: structuredClone(seedProducts),
  projects: [],
  drafts: {},
  favorites: ["insulation", "deck", "sheets"],
  recent: [],
  theme: "light",
  activeProjectId: "",
  locations: {},
  catalogRevision,
});
const db = () =>
  openDB("monter-assistent", 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains("app"))
        database.createObjectStore("app");
    },
  });
export async function loadData(): Promise<AppData> {
  const database = await db();
  return upgradeCatalog((await database.get("app", "data")) ?? emptyData());
}
export function upgradeCatalog(data: AppData): AppData {
  if ((data.catalogRevision || 0) >= catalogRevision) return data;
  const additions = catalogAdditions.filter(
    (p) =>
      !data.products.some(
        (x) =>
          x.id === p.id ||
          (p.nobb && p.nobb === x.nobb) ||
          (p.monterSku && p.monterSku === x.monterSku),
      ),
  );
  return {
    ...data,
    products: [...data.products, ...structuredClone(additions)],
    catalogRevision,
  };
}
let writes: Promise<void> = Promise.resolve();
export function saveData(data: AppData): Promise<void> {
  const snapshot = structuredClone(data);
  writes = writes
    .catch(() => {})
    .then(async () => {
      const database = await db();
      await database.put("app", snapshot, "data");
    });
  return writes;
}
