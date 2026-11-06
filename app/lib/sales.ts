export type PriceTier = {
  id: string;
  label: string;
  price: number;
};

export type Product = {
  id: string;
  name: string;
  category: string;
  unit: string;
  emoji: string;
  tiers: PriceTier[];
};

export type SaleLine = {
  productId: string;
  productName: string;
  emoji: string;
  tierId: string;
  tierLabel: string;
  quantity: number;
  unitPrice: number;
};

export type SaleTransaction = {
  id: string;
  createdAt: string;
  lines: SaleLine[];
  outletName?: string;
  amountReceived?: number;
  transferAmount?: number;
  adminAmount?: number;
};

export const STORAGE_KEY = "laris-sales-v1";
export const RETENTION_DAYS = 3;
export const RETENTION_MS = RETENTION_DAYS * 24 * 60 * 60 * 1000;

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function localDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatLongDate(date: Date): string {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function isSaleLine(value: unknown): value is SaleLine {
  if (!value || typeof value !== "object") return false;
  const line = value as Record<string, unknown>;
  return (
    typeof line.productId === "string" &&
    typeof line.productName === "string" &&
    typeof line.emoji === "string" &&
    typeof line.tierId === "string" &&
    typeof line.tierLabel === "string" &&
    typeof line.quantity === "number" &&
    Number.isInteger(line.quantity) &&
    line.quantity > 0 &&
    typeof line.unitPrice === "number" &&
    Number.isFinite(line.unitPrice) &&
    line.unitPrice >= 0
  );
}

export function isSaleTransaction(value: unknown): value is SaleTransaction {
  if (!value || typeof value !== "object") return false;
  const transaction = value as Record<string, unknown>;
  return (
    typeof transaction.id === "string" &&
    typeof transaction.createdAt === "string" &&
    Number.isFinite(Date.parse(transaction.createdAt)) &&
    (transaction.outletName === undefined ||
      typeof transaction.outletName === "string") &&
    (transaction.amountReceived === undefined ||
      (typeof transaction.amountReceived === "number" &&
        Number.isFinite(transaction.amountReceived) &&
        transaction.amountReceived >= 0)) &&
    (transaction.transferAmount === undefined ||
      (typeof transaction.transferAmount === "number" &&
        Number.isFinite(transaction.transferAmount) &&
        transaction.transferAmount >= 0)) &&
    (transaction.adminAmount === undefined ||
      (typeof transaction.adminAmount === "number" &&
        Number.isFinite(transaction.adminAmount) &&
        transaction.adminAmount >= 0)) &&
    Array.isArray(transaction.lines) &&
    transaction.lines.length > 0 &&
    transaction.lines.every(isSaleLine)
  );
}