// Reads the synthetic fixtures in data/synthetic/. Every file there carries "synthetic": true. Owned by Foundation.
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import type { Catalog, EstimateSample, Product } from "@goodleap/shared";

export const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const DATA_DIR = resolve(REPO_ROOT, "data/synthetic");

export function readSynthetic<T>(relPath: string): T {
  return JSON.parse(readFileSync(resolve(DATA_DIR, relPath), "utf8")) as T;
}

let catalog: Catalog | null = null;
export function loadCatalog(): Catalog {
  catalog ??= readSynthetic<Catalog>("catalog.json");
  return catalog;
}

export function findProduct(id: string): Product | undefined {
  return loadCatalog().products.find((p) => p.id === id);
}

interface EstimateIndex { estimates: { id: string; name: string; contractorId: string; file: string }[] }
export function listEstimates(): EstimateSample[] {
  return readSynthetic<EstimateIndex>("estimates/index.json").estimates.map((e) => ({
    id: e.id, name: e.name, contractorId: e.contractorId,
    text: readFileSync(resolve(DATA_DIR, "estimates", e.file), "utf8"),
  }));
}
