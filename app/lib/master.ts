import type { Product } from "./sales";
import type { Outlet } from "./catalog";

export const MASTER_STORAGE_KEY = "laris-master-data-v1";

export type MasterCatalog = {
  products: Product[];
  outlets: Outlet[];
};

function isPriceTier(value: unknown): boolean {
  if (!value || typeof value !== "object") return false;
  const tier = value as Record<string, unknown>;
  return (
    typeof tier.id === "string" &&
    typeof tier.label === "string" &&
    typeof tier.price === "number" &&
    Number.isFinite(tier.price) &&
    tier.price >= 0
  );
}

function isProduct(value: unknown): value is Product {
  if (!value || typeof value !== "object") return false;
  const product = value as Record<string, unknown>;
  return (
    typeof product.id === "string" &&
    typeof product.name === "string" &&
    typeof product.category === "string" &&
    typeof product.unit === "string" &&
    typeof product.emoji === "string" &&
    Array.isArray(product.tiers) &&
    product.tiers.every(isPriceTier)
  );
}

function isOutlet(value: unknown): value is Outlet {
  if (!value || typeof value !== "object") return false;
  const outlet = value as Record<string, unknown>;
  return (
    typeof outlet.id === "string" &&
    typeof outlet.name === "string" &&
    (outlet.city === undefined || typeof outlet.city === "string")
  );
}

export function parseMasterCatalog(value: string): MasterCatalog {
  const parsed: unknown = JSON.parse(value);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Format data master tidak dikenali.");
  }
  const catalog = parsed as Record<string, unknown>;
  if (
    !Array.isArray(catalog.products) ||
    !catalog.products.every(isProduct) ||
    !Array.isArray(catalog.outlets) ||
    !catalog.outlets.every(isOutlet)
  ) {
    throw new Error("Data master rusak atau tidak sesuai format.");
  }
  return {
    products: catalog.products,
    outlets: catalog.outlets,
  };
}
