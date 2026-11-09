import { openDB } from "idb";
import type { AppData } from "./types";
import { seedProducts } from "./seed";
export const emptyData = (): AppData => ({
  schemaVersion: 1,
  products: structuredClone(seedProducts),
  projects: [],
  drafts: {},
  favorites: ["insulation", "deck", "sheets"],
  recent: [],
  theme: "light",
  activeProjectId: "",
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
  return (await database.get("app", "data")) ?? emptyData();
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
