"use client";

import {
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import {
  formatRupiah,
  isSaleTransaction,
  localDateKey,
  RETENTION_MS,
  SaleLine,
  Product,
  PriceTier,
  SaleTransaction,
  STORAGE_KEY,
} from "./lib/sales";
import { type Outlet } from "./lib/catalog";
import { supabase } from "./lib/supabase";
import MasterData from "./master-data";
import Image from "next/image";

type View = "cashier" | "report" | "master";
type CartLine = SaleLine & { key: string };
type OutletReport = {
  outletName: string;
  transactionCount: number;
  itemCount: number;
  total: number;
  deposit: number;
  hasDeposit: boolean;
  transfer: number;
  admin: number;
  lines: (SaleLine & { total: number })[];
};
type SupabasePriceTierRow = {
  tier_code: string;
  tier_name: string;
  price_idr: number | null;
};
type SupabaseProductRow = {
  id: number | string;
  sku: string;
  category: string;
  name: string;
  unit: string | null;
  emoji: string | null;
  price_tiers: SupabasePriceTierRow[] | null;
};
type SupabaseOutletRow = { id: number | string; name: string };
type SupabaseSaleRow = {
  id: string;
  created_at: string;
  outlet_name: string;
  amount_received: number | null;
  transfer_amount: number | null;
  admin_amount: number | null;
  lines: unknown;
};
type IconName =
  | "brand"
  | "cashier"
  | "report"
  | "master"
  | "calendar"
  | "money"
  | "receipt"
  | "box"
  | "search"
  | "plus"
  | "minus"
  | "trash"
  | "cart"
  | "copy"
  | "check"
  | "clock"
  | "alert";

const REPORT_MENTIONS = " @";
const REPORT_DIVIDER = "-----------------------------------";

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "").replace(/^0+(?=\d)/, "");
}

function groupThousands(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function rp(amount: number): string {
  const sign = amount < 0 ? "-" : "";
  return `${sign}Rp ${groupThousands(String(Math.abs(Math.round(amount))))}`;
}

function reportLineName(line: SaleLine): string {
  return line.productName
    .toLocaleLowerCase("id-ID")
    .includes(line.tierLabel.toLocaleLowerCase("id-ID"))
    ? line.productName
    : `${line.productName}`;
}

function normalizeSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id-ID")
    .replace(/\s+/g, " ")
    .trim();
}

function saleToDatabaseRow(transaction: SaleTransaction) {
  return {
    id: transaction.id,
    created_at: transaction.createdAt,
    outlet_name: transaction.outletName ?? "",
    amount_received: transaction.amountReceived ?? null,
    transfer_amount: transaction.transferAmount ?? null,
    admin_amount: transaction.adminAmount ?? null,
    lines: transaction.lines,
  };
}

function isSupabaseSaleRow(value: unknown): value is SupabaseSaleRow {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return (
    typeof row.id === "string" &&
    typeof row.created_at === "string" &&
    typeof row.outlet_name === "string" &&
    (row.amount_received === null || typeof row.amount_received === "number") &&
    (row.transfer_amount === null || typeof row.transfer_amount === "number") &&
    (row.admin_amount === null || typeof row.admin_amount === "number") &&
    Array.isArray(row.lines)
  );
}

function readLegacyTransactions(): SaleTransaction[] {
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (!stored) return [];

  const parsed: unknown = JSON.parse(stored);
  if (!Array.isArray(parsed)) {
    throw new Error("Format laporan lama pada perangkat tidak dikenali.");
  }

  const cutoff = Date.now() - RETENTION_MS;
  return parsed.filter(
    (value): value is SaleTransaction =>
      isSaleTransaction(value) && Date.parse(value.createdAt) >= cutoff,
  );
}

function buildSoReport({
  outletName,
  dateKey,
  lines,
  deposit,
  transfer = 0,
  admin = 0,
  withMentions = true,
}: {
  outletName: string;
  dateKey: string;
  lines: SaleLine[];
  deposit?: number;
  transfer?: number;
  admin?: number;
  withMentions?: boolean;
}): string {
  const total = lines.reduce((sum, line) => sum + line.quantity * line.unitPrice, 0);
  return [
    "📋 LAPORAN BARANG LAKU SAAT SO",
    `Cabang: ${outletName || "-"}`,
    `Tanggal: ${longDateId(dateKey)}`,
    REPORT_DIVIDER,
    ...(lines.length
      ? lines.flatMap((line, index) => [
          `${index + 1}. ${reportLineName(line)}`,
          `       ${line.quantity} ${line.tierLabel} x ${rp(line.unitPrice)}`,
          `       = ${rp(line.quantity * line.unitPrice)}`,
        ])
      : ["(belum ada barang laku)"]),
    REPORT_DIVIDER,
    `TOTAL  : ${rp(total)}`,
    ...(deposit !== undefined ? [`TITIP : ${rp(deposit)}`] : []),
    `TOTAL TF : ${rp(transfer)}`,
    `ADMIN    : ${rp(admin)}`,
    ...(withMentions ? ["", REPORT_MENTIONS] : []),
  ].join("\n");
}

function longDateId(dateKey?: string): string {
  if (!dateKey && typeof window === "undefined") {
    return "-";
  }
  const date = dateKey ? new Date(`${dateKey}T12:00:00`) : new Date();
  if (isNaN(date.getTime())) {
    return "-";
  }
  return date.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function MoneyInput({
  id,
  value,
  onChange,
  placeholder = "0",
}: {
  id: string;
  value: string;
  onChange: (digits: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="deposit-input-wrap">
      <span>Rp</span>
      <input
        autoComplete="off"
        id={id}
        inputMode="numeric"
        onChange={(event) => onChange(digitsOnly(event.target.value))}
        placeholder={placeholder}
        type="text"
        value={groupThousands(value)}
      />
    </div>
  );
}

function subscribeToDateChange(callback: () => void) {
  const interval = window.setInterval(callback, 60_000);
  window.addEventListener("focus", callback);
  return () => {
    window.clearInterval(interval);
    window.removeEventListener("focus", callback);
  };
}

function getLocalDateSnapshot() {
  return localDateKey(new Date());
}

function getServerDateSnapshot() {
  return "";
}

function useLocalDateKey() {
  return useSyncExternalStore(
    subscribeToDateChange,
    getLocalDateSnapshot,
    getServerDateSnapshot,
  );
}

function Icon({
  name,
  size = 18,
  className,
}: {
  name: IconName;
  size?: number;
  className?: string;
}) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    strokeWidth: 1.8,
  };
  const paths: Record<IconName, React.ReactNode> = {
    brand: (
      <>
        <path {...common} d="M4 13.5 9.5 19 20 5" />
        <path {...common} d="M5 5h5M4 9h3" />
      </>
    ),
    cashier: (
      <>
        <rect {...common} x="3" y="6" width="18" height="14" rx="2" />
        <path {...common} d="M7 6V4h10v2M7 11h10M7 15h2m3 0h2m3 0h.01" />
      </>
    ),
    report: (
      <>
        <path {...common} d="M4 19V5m0 14h17" />
        <path {...common} d="m7 15 4-4 3 2 5-6" />
      </>
    ),
    master: (
      <>
        <rect {...common} x="3" y="4" width="18" height="16" rx="2" />
        <path {...common} d="M8 4v16M3 9h5m-5 5h5m5-6h5m-5 4h5m-5 4h3" />
      </>
    ),
    calendar: (
      <>
        <rect {...common} x="3" y="5" width="18" height="16" rx="2" />
        <path {...common} d="M16 3v4M8 3v4M3 10h18" />
      </>
    ),
    money: (
      <>
        <rect {...common} x="3" y="5" width="18" height="14" rx="2" />
        <circle {...common} cx="12" cy="12" r="3" />
        <path {...common} d="M7 9h.01M17 15h.01" />
      </>
    ),
    receipt: (
      <>
        <path {...common} d="M5 3h14v18l-3-2-4 2-4-2-3 2z" />
        <path {...common} d="M8 8h8M8 12h8M8 16h4" />
      </>
    ),
    box: (
      <>
        <path {...common} d="m12 3 9 5-9 5-9-5 9-5Z" />
        <path {...common} d="M3 8v9l9 5 9-5V8M12 13v9" />
      </>
    ),
    search: (
      <>
        <circle {...common} cx="10.8" cy="10.8" r="6.8" />
        <path {...common} d="m16 16 4 4" />
      </>
    ),
    plus: <path {...common} d="M12 5v14M5 12h14" />,
    minus: <path {...common} d="M5 12h14" />,
    trash: (
      <>
        <path {...common} d="M4 7h16M10 11v6m4-6v6M6 7l1 14h10l1-14M9 7V4h6v3" />
      </>
    ),
    cart: (
      <>
        <path {...common} d="M3 4h2l2.2 11.1a2 2 0 0 0 2 1.6h8.5a2 2 0 0 0 1.9-1.4L21 8H6" />
        <circle {...common} cx="10" cy="20" r="1" />
        <circle {...common} cx="18" cy="20" r="1" />
      </>
    ),
    copy: (
      <>
        <rect {...common} x="8" y="8" width="12" height="12" rx="2" />
        <path {...common} d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" />
      </>
    ),
    check: <path {...common} d="m5 12 4 4L19 6" />,
    clock: (
      <>
        <circle {...common} cx="12" cy="12" r="9" />
        <path {...common} d="M12 7v5l3 2" />
      </>
    ),
    alert: (
      <>
        <path {...common} d="M10.3 4.4 2.8 18a2 2 0 0 0 1.8 3h14.8a2 2 0 0 0 1.8-3L13.7 4.4a2 2 0 0 0-3.4 0Z" />
        <path {...common} d="M12 9v4m0 4h.01" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
    >
      {paths[name]}
    </svg>
  );
}

export default function PosDashboard() {
  const [mounted, setMounted] = useState(false);
  const [view, setView] = useState<View>("cashier");
  const [transactions, setTransactions] = useState<SaleTransaction[]>([]);
  const [masterProducts, setMasterProducts] = useState<Product[]>([]);
  const [masterOutlets, setMasterOutlets] = useState<Outlet[]>([]);
  const [masterReady, setMasterReady] = useState(false);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [searchProduct, setSearchProduct] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchOutlet, setSearchOutlet] = useState("");
  const [selectedOutlet, setSelectedOutlet] = useState<Outlet | null>(null);
  const [depositAmount, setDepositAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [adminInput, setAdminInput] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const currentDate = useLocalDateKey();
  const [loaded, setLoaded] = useState(false);
  const [masterLoadError, setMasterLoadError] = useState("");
  const [productLoadError, setProductLoadError] = useState("");
  const [outletLoadError, setOutletLoadError] = useState("");
  const [transactionLoadError, setTransactionLoadError] = useState("");
  const [operationError, setOperationError] = useState("");
  const [savingSale, setSavingSale] = useState(false);
  const [toast, setToast] = useState<{ message: string; error: boolean } | null>(
    null,
  );

  // Ambil Data Produk, Price Tiers, dan Ruko dari Supabase secara asinkron
  useEffect(() => {
    const mountTimeout = window.setTimeout(() => setMounted(true), 0);
    async function fetchSupabaseData() {
      let transactionsLoaded = false;
      const initializationErrors: string[] = [];
      try {
        let legacyTransactions: SaleTransaction[] = [];
        try {
          legacyTransactions = readLegacyTransactions();
        } catch (error) {
          const message =
            error instanceof Error ? error.message : "Format laporan lama rusak.";
          initializationErrors.push(`Migrasi transaksi lama: ${message}`);
        }

        if (legacyTransactions.length > 0) {
          const { error } = await supabase
            .from("sales_transactions")
            .upsert(legacyTransactions.map(saleToDatabaseRow), {
              onConflict: "id",
              ignoreDuplicates: true,
            });
          if (error) {
            initializationErrors.push(
              `Migrasi transaksi lama ke database gagal: ${error.message}`,
            );
          } else {
            window.localStorage.removeItem(STORAGE_KEY);
          }
        } else {
          window.localStorage.removeItem(STORAGE_KEY);
        }

        const cutoff = new Date(Date.now() - RETENTION_MS).toISOString();
        const [productResponse, outletResponse, transactionResponse] =
          await Promise.all([
          supabase.from("products").select(`
            id,
            sku,
            category,
            name,
            unit,
            emoji,
            price_tiers (
              tier_code,
              tier_name,
              price_idr
            )
          `),
          supabase.from("rukos").select("id, name").order("name"),
          supabase
            .from("sales_transactions")
            .select(
              "id, created_at, outlet_name, amount_received, transfer_amount, admin_amount, lines",
            )
            .gte("created_at", cutoff)
            .order("created_at", { ascending: false }),
        ]);

        const formattedProducts: Product[] = (productResponse.data ?? []).map(
          (p: SupabaseProductRow) => ({
            id: String(p.id),
            sku: p.sku,
            name: p.name,
            category: p.category,
            unit: p.unit || "BTL",
            emoji: p.emoji || "🍾",
            tiers: (p.price_tiers ?? [])
              .filter(
                (tier): tier is SupabasePriceTierRow & { price_idr: number } =>
                  tier.price_idr !== null,
              )
              .map((tier) => ({
                id: tier.tier_code,
                label: tier.tier_name,
                price: tier.price_idr,
              })),
          }),
        );
        const formattedOutlets: Outlet[] = (outletResponse.data ?? []).map(
          (r: SupabaseOutletRow) => ({
            id: String(r.id),
            name: r.name,
          }),
        );

        setMasterProducts(formattedProducts);
        setMasterOutlets(formattedOutlets);

        const productError = productResponse.error
          ? `Barang/harga gagal dimuat: ${productResponse.error.message}`
          : formattedProducts.length === 0
            ? "Data barang dan tier harga masih kosong."
            : "";
        const outletError = outletResponse.error
          ? `Daftar ruko gagal dimuat: ${outletResponse.error.message}`
          : formattedOutlets.length === 0
            ? "Data ruko masih kosong."
            : "";
        setProductLoadError(productError);
        setOutletLoadError(
          outletError
            ? `Data ruko belum tersedia: ${outletError}`
            : "",
        );
        setMasterLoadError([productError, outletError].filter(Boolean).join(" "));

        if (transactionResponse.error) {
          setTransactionLoadError(
            `Gagal memuat laporan dari database: ${transactionResponse.error.message}`,
          );
        } else {
          const transactionRows: unknown[] = transactionResponse.data ?? [];
          const parsedTransactions: unknown[] = transactionRows
            .filter(isSupabaseSaleRow)
            .map((row) => ({
              id: row.id,
              createdAt: row.created_at,
              outletName: row.outlet_name,
              ...(row.amount_received !== null
                ? { amountReceived: row.amount_received }
                : {}),
              ...(row.transfer_amount !== null
                ? { transferAmount: row.transfer_amount }
                : {}),
              ...(row.admin_amount !== null
                ? { adminAmount: row.admin_amount }
                : {}),
              lines: row.lines,
            }));
          const freshTransactions = parsedTransactions.filter(isSaleTransaction);
          setTransactions(freshTransactions);
          transactionsLoaded = true;
          setTransactionLoadError("");

          const { error: expiryError } = await supabase
            .from("sales_transactions")
            .delete()
            .lt("created_at", cutoff);
          if (expiryError) {
            initializationErrors.push(
              `Penghapusan transaksi lebih dari 3 hari gagal: ${expiryError.message}`,
            );
          }
        }
      } catch (error) {
        console.error("Gagal memuat data Supabase:", error);
        const message =
          error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
        setMasterLoadError(`Gagal memuat data master Supabase: ${message}`);
        setProductLoadError(`Data barang tidak dapat dimuat: ${message}`);
        setOutletLoadError(`Daftar ruko tidak dapat dimuat: ${message}`);
        setTransactionLoadError(`Gagal memuat laporan dari database: ${message}`);
      } finally {
        setMasterReady(true);
        setLoaded(transactionsLoaded);
        setOperationError(initializationErrors.join(" "));
      }
    }

    fetchSupabaseData();
    return () => window.clearTimeout(mountTimeout);
  }, []);

  async function persistProducts(products: Product[]): Promise<boolean> {
    try {
      const nextProducts = [...products];
      const nextIds = new Set(nextProducts.map((product) => product.id));
      const removedIds = masterProducts
        .filter((product) => !nextIds.has(product.id))
        .map((product) => Number(product.id));

      const changedProducts = nextProducts.filter((product) => {
        const existing = masterProducts.find((item) => item.id === product.id);
        return (
          !existing ||
          JSON.stringify({
            name: existing.name,
            category: existing.category,
            unit: existing.unit,
            emoji: existing.emoji,
            tiers: existing.tiers,
          }) !==
            JSON.stringify({
              name: product.name,
              category: product.category,
              unit: product.unit,
              emoji: product.emoji,
              tiers: product.tiers,
            })
        );
      });

      for (const product of changedProducts) {
        const isNew = !product.id;
        const productId = isNew ? null : Number(product.id);
        if (productId !== null && !Number.isSafeInteger(productId)) {
          throw new Error(`ID barang tidak valid: ${product.id}`);
        }
        const { data, error } = await supabase.rpc("save_product_with_tiers", {
          p_product_id: productId,
          p_sku: isNew ? `MAN-${crypto.randomUUID()}` : null,
          p_category: product.category,
          p_name: product.name,
          p_unit: product.unit,
          p_emoji: product.emoji || "🍾",
          p_tiers: product.tiers.map((tier) => ({
            tier_code: tier.id,
            tier_name: tier.label,
            price_idr: tier.price,
          })),
        });
        if (error) throw error;
        if (typeof data !== "number" && typeof data !== "string") {
          throw new Error("Database tidak mengembalikan ID barang.");
        }
        const savedId = String(data);
        const index = nextProducts.findIndex((item) => item.id === product.id);
        nextProducts[index] = { ...product, id: savedId };
      }

      if (removedIds.length > 0) {
        if (removedIds.some((id) => !Number.isSafeInteger(id))) {
          throw new Error("ID barang yang akan dihapus tidak valid.");
        }
        const { error } = await supabase
          .from("products")
          .delete()
          .in("id", removedIds);
        if (error) throw error;
      }

      setMasterProducts(nextProducts);
      setOperationError("");
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan data barang.";
      setOperationError(`Data barang gagal disimpan ke database: ${message}`);
      setToast({ message: "Gagal menyimpan barang ke database.", error: true });
      return false;
    }
  }

  async function persistOutlets(outlets: Outlet[]): Promise<boolean> {
    try {
      const nextOutlets = [...outlets];
      const nextIds = new Set(nextOutlets.map((outlet) => outlet.id));
      const removedIds = masterOutlets
        .filter((outlet) => !nextIds.has(outlet.id))
        .map((outlet) => Number(outlet.id));

      for (const outlet of nextOutlets) {
        const existing = masterOutlets.find((item) => item.id === outlet.id);
        if (!existing) {
          const { data, error } = await supabase
            .from("rukos")
            .insert({ name: outlet.name })
            .select("id, name")
            .single();
          if (error) throw error;
          nextOutlets[nextOutlets.indexOf(outlet)] = {
            id: String(data.id),
            name: data.name,
          };
        } else if (existing.name !== outlet.name) {
          const id = Number(outlet.id);
          if (!Number.isSafeInteger(id)) {
            throw new Error(`ID ruko tidak valid: ${outlet.id}`);
          }
          const { error } = await supabase
            .from("rukos")
            .update({ name: outlet.name })
            .eq("id", id);
          if (error) throw error;
        }
      }

      if (removedIds.length > 0) {
        if (removedIds.some((id) => !Number.isSafeInteger(id))) {
          throw new Error("ID ruko yang akan dihapus tidak valid.");
        }
        const { error } = await supabase
          .from("rukos")
          .delete()
          .in("id", removedIds);
        if (error) throw error;
      }

      setMasterOutlets(nextOutlets);
      setSelectedOutlet((current) =>
        current
          ? nextOutlets.find((outlet) => outlet.id === current.id) ?? null
          : null,
      );
      setOperationError("");
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan data ruko.";
      setOperationError(`Data ruko gagal disimpan ke database: ${message}`);
      setToast({ message: "Gagal menyimpan ruko ke database.", error: true });
      return false;
    }
  }

  useEffect(() => {
    if (!loaded || transactions.length === 0) return;
    const nextExpiry = Math.min(
      ...transactions.map(
        (transaction) => Date.parse(transaction.createdAt) + RETENTION_MS,
      ),
    );
    const timeout = window.setTimeout(() => {
      const expired = transactions.filter(
        (transaction) =>
          Date.now() - Date.parse(transaction.createdAt) >= RETENTION_MS,
      );
      void (async () => {
        if (expired.length === 0) return;
        const { error } = await supabase
          .from("sales_transactions")
          .delete()
          .in(
            "id",
            expired.map((transaction) => transaction.id),
          );
        if (error) {
          setOperationError(
            `Penghapusan transaksi kedaluwarsa gagal: ${error.message}`,
          );
          return;
        }
        const expiredIds = new Set(expired.map((transaction) => transaction.id));
        setTransactions((current) =>
          current.filter((transaction) => !expiredIds.has(transaction.id)),
        );
      })();
    }, Math.max(0, nextExpiry - Date.now()));
    return () => window.clearTimeout(timeout);
  }, [transactions, loaded]);

  useEffect(() => {
    if (!toast) return;
    const timeout = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [toast]);

  const visibleProducts = useMemo(() => {
    const query = normalizeSearch(searchProduct);
    return masterProducts.filter((product) => {
      return normalizeSearch(`${product.name} ${product.category}`).includes(query);
    });
  }, [searchProduct, masterProducts]);
  
  const matchingOutlets = useMemo(() => {
    const query = normalizeSearch(searchOutlet);
    if (!query || selectedOutlet) return [];
    return masterOutlets.filter(
      (outlet) => normalizeSearch(outlet.name).includes(query),
    );
  }, [searchOutlet, selectedOutlet, masterOutlets]);

  const todayKey =
    view === "report" ? selectedDate || currentDate : currentDate;
    
  const dailyTransactions = useMemo(
    () =>
      transactions.filter(
        (transaction) =>
          localDateKey(new Date(transaction.createdAt)) === todayKey,
      ),
    [transactions, todayKey],
  );

  const outletReports = useMemo(() => {
    const groups = new Map<string, OutletReport>();
    for (const transaction of dailyTransactions) {
      const outletName = transaction.outletName?.trim() || "Tanpa ruko";
      let report = groups.get(outletName);
      if (!report) {
        report = {
          outletName,
          transactionCount: 0,
          itemCount: 0,
          total: 0,
          deposit: 0,
          hasDeposit: false,
          transfer: 0,
          admin: 0,
          lines: [],
        };
        groups.set(outletName, report);
      }
      report.transactionCount += 1;
      report.transfer += transaction.transferAmount ?? 0;
      report.admin += transaction.adminAmount ?? 0;
      if (transaction.amountReceived !== undefined) {
        report.hasDeposit = true;
        report.deposit += transaction.amountReceived;
      }
      for (const line of transaction.lines) {
        const subtotal = line.quantity * line.unitPrice;
        report.itemCount += line.quantity;
        report.total += subtotal;
        const existing = report.lines.find(
          (item) =>
            item.productId === line.productId && item.tierId === line.tierId,
        );
        if (existing) {
          existing.quantity += line.quantity;
          existing.total += subtotal;
        } else {
          report.lines.push({ ...line, total: subtotal });
        }
      }
    }
    return [...groups.values()].sort((a, b) =>
      a.outletName.localeCompare(b.outletName, "id-ID", { numeric: true }),
    );
  }, [dailyTransactions]);

  const cartTotal = cart.reduce(
    (sum, line) => sum + line.quantity * line.unitPrice,
    0,
  );
  const cartCount = cart.reduce((sum, line) => sum + line.quantity, 0);
  const receivedAmount = Number(depositAmount) || 0;
  const transferValue = Number(transferAmount) || 0;
  const autoAdmin =
    transferValue > 0 ? Math.max(0, receivedAmount - transferValue) : 0;
  const adminValue =
    adminInput !== null ? Number(adminInput) || 0 : autoAdmin;
  const difference = receivedAmount - cartTotal;
  const hasDeposit = depositAmount !== "";
  
  const saleSummary = useMemo(() => {
    return buildSoReport({
      outletName: selectedOutlet?.name ?? "",
      dateKey: mounted ? currentDate : "",
      lines: cart,
      deposit: hasDeposit ? receivedAmount : undefined,
      transfer: transferValue,
      admin: adminValue,
    });
  }, [
    selectedOutlet,
    mounted,
    currentDate,
    cart,
    hasDeposit,
    receivedAmount,
    transferValue,
    adminValue,
  ]);

  function addToCart(product: Product, tier: PriceTier) {
    const key = `${product.id}:${tier.id}`;
    setCart((current) => {
      const existing = current.find((line) => line.key === key);
      if (existing) {
        return current.map((line) =>
          line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
        );
      }
      return [
        ...current,
        {
          key,
          productId: product.id,
          productName: product.name,
          emoji: product.emoji,
          tierId: tier.id,
          tierLabel: tier.label,
          quantity: 1,
          unitPrice: tier.price,
        },
      ];
    });
  }

  function changeQuantity(key: string, change: number) {
    setCart((current) =>
      current
        .map((line) =>
          line.key === key
            ? { ...line, quantity: line.quantity + change }
            : line,
        )
        .filter((line) => line.quantity > 0),
    );
  }

  async function checkout() {
    if (cart.length === 0) return;
    if (!selectedOutlet) {
      setToast({ message: "Pilih outlet terlebih dahulu.", error: true });
      return;
    }
    if (!loaded) {
      setToast({
        message: "Laporan database belum siap. Muat ulang aplikasi lalu coba lagi.",
        error: true,
      });
      return;
    }
    setSavingSale(true);
    const transaction: SaleTransaction = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      outletName: selectedOutlet.name,
      ...(hasDeposit ? { amountReceived: receivedAmount } : {}),
      ...(transferAmount !== "" ? { transferAmount: transferValue } : {}),
      ...(adminValue > 0 ? { adminAmount: adminValue } : {}),
      lines: cart.map((line) => ({
        productId: line.productId,
        productName: line.productName,
        emoji: line.emoji,
        tierId: line.tierId,
        tierLabel: line.tierLabel,
        quantity: line.quantity,
        unitPrice: line.unitPrice,
      })),
    };

    try {
      const { error } = await supabase
        .from("sales_transactions")
        .insert(saleToDatabaseRow(transaction));
      if (error) throw error;

      setTransactions((current) => [transaction, ...current]);
      setCart([]);
      setDepositAmount("");
      setTransferAmount("");
      setAdminInput(null);
      setSelectedProduct(null);
      setOperationError("");
      setToast({ message: "Penjualan berhasil disimpan ke database.", error: false });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal menyimpan transaksi.";
      setOperationError(`Transaksi gagal disimpan ke database: ${message}`);
      setToast({ message: "Gagal menyimpan penjualan ke database.", error: true });
    } finally {
      setSavingSale(false);
    }
  }

  async function copyAuditSummary() {
    try {
      await navigator.clipboard.writeText(saleSummary);
      setToast({
        message: "Ringkasan setoran disalin, siap ditempel ke WhatsApp.",
        error: false,
      });
    } catch {
      setToast({
        message: "Gagal menyalin. Izinkan akses clipboard lalu coba lagi.",
        error: true,
      });
    }
  }

  function outletReportText(report: OutletReport, withMentions: boolean) {
    return buildSoReport({
      outletName: report.outletName,
      dateKey: todayKey || localDateKey(new Date()),
      lines: report.lines,
      deposit: report.hasDeposit ? report.deposit : undefined,
      transfer: report.transfer,
      admin: report.admin,
      withMentions,
    });
  }

  async function copyOutletReport(report: OutletReport) {
    await copyText(
      outletReportText(report, true),
      `Laporan ${report.outletName} disalin, siap ditempel ke WhatsApp.`,
    );
  }

  async function copyAllReports(reports: OutletReport[]) {
    if (reports.length === 0) return;
    const body = reports
      .map((report) => outletReportText(report, false))
      .join("\n\n");
    await copyText(
      `${body}\n\n${REPORT_MENTIONS}`,
      "Laporan semua ruko disalin, siap ditempel ke WhatsApp.",
    );
  }

  async function copyText(text: string, successMessage: string) {
    try {
      await navigator.clipboard.writeText(text);
      setToast({ message: successMessage, error: false });
    } catch {
      setToast({
        message: "Gagal menyalin. Izinkan akses clipboard lalu coba lagi.",
        error: true,
      });
    }
  }

  const activeTitle =
    view === "cashier"
      ? "Kasir"
      : view === "report"
        ? "Laporan barang laku"
        : "Data master";
  const databaseErrors = [
    masterLoadError,
    transactionLoadError,
    operationError,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="app-shell">
      <aside className="sidebar" aria-label="Navigasi utama">
        <div className="brand">
          
            <Image className="brand-mark" src="/meksiko.jpg" alt="Meksiko Group" width={44} height={44} />
          
          <div>
            <div className="brand-name">Meksiko Group</div>
            <div className="brand-caption">Laporan Barang Laku</div>
          </div>
        </div>
        <div className="nav-label">Menu utama</div>
        <Navigation view={view} onNavigate={setView} />
        <div className="sidebar-bottom">
          <div className="retention-card">
            <div className="retention-heading">
              <Icon name="clock" size={16} />
              Retensi data
            </div>
            <p className="retention-copy">
              Transaksi tersimpan di database dan otomatis dihapus setelah 3
              hari.
            </p>
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <h1 className="topbar-title text-lg font-bold">Meksiko Group</h1>
        </header>

        <main className="content-wrap">
          {databaseErrors && (
            <div className="storage-alert" role="alert">
              <Icon name="alert" size={17} />
              <span>{databaseErrors}</span>
            </div>
          )}

          {view === "cashier" ? (
            <section className="workspace-grid cashier-layout" aria-label="Kasir">
              <div className="cashier-left-stack">
                <section className="panel outlet-panel">
                  <label className="field-label" htmlFor="outlet-search">
                    ▸ Cari &amp; pilih ruko / outlet
                  </label>
                  <div className="outlet-search-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <span className="outlet-icon-wrapper" style={{ position: 'absolute', left: '12px', display: 'flex', pointerEvents: 'none' }}>
                      <Icon name="search" size={17} />
                    </span>
                    <input
                      autoComplete="off"
                      className="outlet-search"
                      style={{ paddingLeft: '38px' }} // Beri ruang agar teks tidak menimpa ikon
                      id="outlet-search"
                      onChange={(event) => {
                        setSelectedOutlet(null);
                        setSearchOutlet(event.target.value);
                      }}
                      placeholder="Ketik nama ruko..."
                      value={selectedOutlet?.name ?? searchOutlet}
                    />
                    {selectedOutlet && (
                      <button
                        aria-label="Ganti outlet"
                        className="outlet-clear"
                        onClick={() => {
                          setSelectedOutlet(null);
                          setSearchOutlet("");
                        }}
                        type="button"
                      >
                        ×
                      </button>
                    )}
                    {matchingOutlets.length > 0 && (
                      <div className="outlet-results">
                        {matchingOutlets.map((outlet) => (
                          <button
                            className="outlet-result"
                            key={outlet.id}
                            onClick={() => {
                              setSelectedOutlet(outlet);
                              setSearchOutlet("");
                            }}
                            type="button"
                          >
                            <span>
                              <strong>{outlet.name}</strong>
                            </span>
                            <span aria-hidden="true">›</span>
                          </button>
                        ))}
                      </div>
                    )}
                    {!selectedOutlet &&
                      matchingOutlets.length === 0 &&
                      searchOutlet.trim().length > 0 && (
                        <div className="outlet-no-results">
                          {!masterReady
                            ? "Memuat daftar ruko..."
                            : outletLoadError
                              ? outletLoadError
                              : `Tidak ada ruko yang cocok dengan “${searchOutlet.trim()}”. Coba nama yang lebih pendek.`}
                        </div>
                      )}
                  </div>
                </section>

                <section className="panel catalog-panel">
                  <div className="panel-header">
                    <div>
                      <h2 className="panel-title">Cari barang</h2>
                      <p className="panel-subtitle">
                        Cari berdasarkan nama barang
                      </p>
                    </div>
                    {searchProduct.trim().length >= 2 && (
                      <span className="cart-count">{visibleProducts.length}</span>
                    )}
                  </div>
                  <div className="catalog-controls">
                    <label className="search-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center', width: '100%' }}>
                      <span className="search-icon-wrapper" style={{ position: 'absolute', left: '12px', display: 'flex', pointerEvents: 'none' }}>
                        <Icon name="search" size={17} />
                      </span>
                      <input
                        aria-label="Cari barang berdasarkan nama"
                        autoComplete="off"
                        className="search-input"
                        style={{ paddingLeft: '38px', width: '100%' }}
                        onChange={(event) => setSearchProduct(event.target.value)}
                        placeholder="Ketik nama barang..."
                        value={searchProduct}
                      />
                    </label>
                  </div>
                  {!masterReady ? (
                    <div className="product-search-hint">
                      <Icon name="clock" size={20} />
                      <span>Memuat barang dan harga dari Supabase...</span>
                    </div>
                  ) : searchProduct.trim().length >= 1 ? (
                    <div className="product-result-list">
                      {visibleProducts.map((product) => {
                        return product.tiers.length > 0 ? (
                          <button
                            className="product-result"
                            key={product.id}
                            onClick={() => setSelectedProduct(product)}
                            type="button"
                          >
                            <span className="product-result-copy">
                              <strong>{product.name}</strong>
                              <small>{product.category}</small>
                            </span>
                            <span className="product-result-price">
                              Mulai {formatRupiah(product.tiers[0].price)}
                            </span>
                            <span className="product-result-chevron">›</span>
                          </button>
                        ) : null;
                      })}
                      {visibleProducts.filter((product) => product.tiers.length > 0)
                        .length === 0 && (
                        <div className="empty-report">
                          {masterLoadError
                            ? "Data barang belum dapat dimuat. Lihat pesan database di atas."
                            : masterProducts.length === 0
                              ? "Data barang dan harga belum tersedia di database."
                              : `Tidak ada barang yang cocok dengan “${searchProduct.trim()}”.`}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="product-search-hint">
                      <Icon name="search" size={22} />
                      <span>Ketik nama barang untuk mencari.</span>
                    </div>
                  )}
                </section>

                <section className="panel sold-items-panel">
                  <div className="panel-header">
                    <div className="sold-items-title">
                      <Icon name="cart" size={19} />
                      <div>
                        <h2 className="panel-title">Daftar barang laku</h2>
                        <p className="panel-subtitle">
                          Periksa jumlah dan harga sebelum menyimpan
                        </p>
                      </div>
                    </div>
                    <span className="cart-count">{cartCount} item</span>
                  </div>
                  <div className="sold-items-content">
                    {cart.length > 0 ? (
                      <div className="sold-items-list">
                        {cart.map((line) => (
                          <div className="sale-item-card" key={line.key}>
                            <div className="sale-item-main">
                              <div>
                                <div className="cart-line-name">
                                  {line.productName}
                                </div>
                                <div className="sale-item-tags">
                                  <span>{formatRupiah(line.unitPrice)} / </span>
                                  <span>{line.tierId}</span>
                                </div>
                              </div>
                            </div>
                            <div className="sale-item-actions">
                              <div className="quantity-controls">
                                <button
                                  aria-label={`Kurangi ${line.productName}`}
                                  className="quantity-button"
                                  onClick={() => changeQuantity(line.key, -1)}
                                  type="button"
                                >
                                  <Icon name="minus" size={12} />
                                </button>
                                <span className="quantity-value">
                                  {line.quantity}
                                </span>
                                <button
                                  aria-label={`Tambah ${line.productName}`}
                                  className="quantity-button"
                                  onClick={() => changeQuantity(line.key, 1)}
                                  type="button"
                                >
                                  <Icon name="plus" size={12} />
                                </button>
                              </div>
                              <strong className="sale-item-subtotal">
                                {formatRupiah(line.quantity * line.unitPrice)}
                              </strong>
                              <button
                                aria-label={`Hapus ${line.productName}`}
                                className="remove-button"
                                onClick={() =>
                                  setCart((current) =>
                                    current.filter(
                                      (item) => item.key !== line.key,
                                    ),
                                  )
                                }
                                type="button"
                              >
                                <Icon name="trash" size={15} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="sold-items-empty">
                        <Icon name="receipt" size={37} />
                        <strong>Belum ada barang</strong>
                        <span>Tambahkan produk untuk mulai mencatat penjualan.</span>
                      </div>
                    )}
                    <div className="sold-items-total">
                      <span>Total ringkasan</span>
                      <strong>{formatRupiah(cartTotal)}</strong>
                    </div>
                  </div>
                </section>
              </div>

              <aside className="panel settlement-panel">
                <div className="settlement-heading">
                  <span className="settlement-dot" />
                  Konfirmasi setoran
                </div>
                <div className="settlement-content">
                  <div className="settlement-info">
                    <span>Outlet terpilih</span>
                    <strong className={selectedOutlet ? "" : "placeholder"}>
                      {selectedOutlet?.name ?? "— Belum dipilih —"}
                    </strong>
                  </div>
                  <div className="settlement-info settlement-total">
                    <span>Total barang laku</span>
                    <strong>{formatRupiah(cartTotal)}</strong>
                  </div>

                  <div className="deposit-field">
                    <label htmlFor="deposit-amount">
                      Nominal titipan fisik
                    </label>
                    <MoneyInput
                      id="deposit-amount"
                      onChange={setDepositAmount}
                      value={depositAmount}
                    />
                    <button
                      className="set-exact-button"
                      onClick={() => setDepositAmount(String(cartTotal))}
                      type="button"
                    >
                      ↔ Atur nominal pas
                    </button>
                  </div>

                  <div className="deposit-field">
                    <label htmlFor="transfer-amount">Total TF</label>
                    <MoneyInput
                      id="transfer-amount"
                      onChange={(digits) => {
                        setTransferAmount(digits);
                        setAdminInput(null);
                      }}
                      value={transferAmount}
                    />
                  </div>

                  <div className="deposit-field">
                    <label htmlFor="admin-amount">
                      Admin{" "}
                      <small className="field-hint">
                        {adminInput === null
                          ? "(otomatis: titip − TF)"
                          : "(manual)"}
                      </small>
                    </label>
                    <MoneyInput
                      id="admin-amount"
                      onChange={setAdminInput}
                      value={
                        adminInput !== null
                          ? adminInput
                          : autoAdmin > 0
                            ? String(autoAdmin)
                            : ""
                      }
                    />
                    {adminInput !== null && (
                      <button
                        className="set-exact-button"
                        onClick={() => setAdminInput(null)}
                        type="button"
                      >
                        ↺ Hitung otomatis
                      </button>
                    )}
                  </div>

                  <div className="settlement-breakdown">
                    <div>
                      <span>TOTAL</span>
                      <strong>{formatRupiah(cartTotal)}</strong>
                    </div>
                    <div>
                      <span>TITIP</span>
                      <strong>{formatRupiah(receivedAmount)}</strong>
                    </div>
                    <div>
                      <span>TOTAL TF</span>
                      <strong>{formatRupiah(transferValue)}</strong>
                    </div>
                    <div>
                      <span>ADMIN</span>
                      <strong>{formatRupiah(adminValue)}</strong>
                    </div>
                  </div>

                  {receivedAmount > 0 && (
                    <div
                      className={`difference-card ${
                        difference < 0
                          ? "short"
                          : difference > 0
                            ? "excess"
                            : "matched"
                      }`}
                    >
                      <span>
                        {difference < 0
                          ? "⚠ Selisih kurang"
                          : difference > 0
                            ? "✓ Selisih lebih"
                            : "✓ Cocok"}
                      </span>
                      <strong>
                        {difference > 0 ? "+" : difference < 0 ? "−" : ""}
                        {formatRupiah(Math.abs(difference))}
                      </strong>
                      <small>
                        {difference < 0
                          ? "Titipan belum cukup menutup total barang laku."
                          : difference > 0
                            ? "Ada kelebihan dari nominal titipan."
                            : "Nominal titipan sesuai dengan total penjualan."}
                      </small>
                    </div>
                  )}

                  <div className="summary-preview">
                    <div className="summary-preview-heading">
                      <span>▸ Teks laporan</span>
                      <button
                        className="secondary-button"
                        onClick={copyAuditSummary}
                        type="button"
                      >
                        <Icon name="copy" size={14} />
                        Salin
                      </button>
                    </div>
                    <pre>{mounted ? saleSummary : "Memuat ringkasan..."}</pre>
                  </div>

                  <button
                    className="primary-button"
                    disabled={
                      cart.length === 0 ||
                      !selectedOutlet ||
                      !loaded ||
                      savingSale
                    }
                    onClick={checkout}
                    type="button"
                  >
                    <Icon name={savingSale ? "clock" : "check"} size={16} />
                    {savingSale ? "Menyimpan ke database..." : "Simpan penjualan"}
                  </button>
                </div>
              </aside>
            </section>
          ) : view === "report" ? (
            <ReportPanel
              date={todayKey}
              error={transactionLoadError}
              ready={loaded}
              onCopyAll={copyAllReports}
              onCopyOutlet={copyOutletReport}
              onDateChange={setSelectedDate}
              reports={outletReports}
            />
          ) : (
            <MasterData
              onNotify={(message, error = false) =>
                setToast({ message, error })
              }
              onSaveOutlets={persistOutlets}
              onSaveProducts={persistProducts}
              outlets={masterOutlets}
              products={masterProducts}
              productLoadError={productLoadError}
              outletLoadError={outletLoadError}
              ready={masterReady}
            />
          )}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Navigasi bawah">
        <Navigation view={view} onNavigate={setView} />
      </nav>
      {selectedProduct && (
        <div
          className="tier-modal-backdrop"
          onClick={() => setSelectedProduct(null)}
        >
          <section
            aria-labelledby="tier-modal-title"
            aria-modal="true"
            className="tier-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <header className="tier-modal-header">
              <div>
                <h2 id="tier-modal-title">Pilih satuan</h2>
                <p>{selectedProduct.name}</p>
              </div>
              <button
                aria-label="Tutup pilihan satuan"
                className="tier-modal-close"
                onClick={() => setSelectedProduct(null)}
                type="button"
              >
                ×
              </button>
            </header>
            <div className="tier-modal-options">
              {selectedProduct.tiers.map((tier) => (
                <button
                  className="tier-option"
                  key={tier.id}
                  onClick={() => {
                    addToCart(selectedProduct, tier);
                    setSelectedProduct(null);
                  }}
                  type="button"
                >
                  <span>
                    <strong>{tier.id}</strong>
                    <small>{selectedProduct.name}</small>
                  </span>
                  <strong className="tier-option-price">
                    {formatRupiah(tier.price)}
                  </strong>
                </button>
              ))}
            </div>
            <footer className="tier-modal-footer">
              Harga satuan mengikuti daftar harga Meksiko Store.
            </footer>
          </section>
        </div>
      )}
      {toast && (
        <div className={`toast${toast.error ? " error" : ""}`} role="status">
          {toast.message}
        </div>
      )}
    </div>
  );
}

function Navigation({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (view: View) => void;
}) {
  return (
    <div className="nav-list">
      <button
        className={`nav-item${view === "report" ? " active" : ""}`}
        onClick={() => onNavigate("report")}
        type="button"
      >
        <Icon name="report" size={18} />
        Laporan barang laku
      </button>
      <button
        className={`nav-item${view === "cashier" ? " active" : ""}`}
        onClick={() => onNavigate("cashier")}
        type="button"
      >
        <Icon name="cashier" size={18} />
        Kasir
      </button>
      <button
        className={`nav-item${view === "master" ? " active" : ""}`}
        onClick={() => onNavigate("master")}
        type="button"
      >
        <Icon name="master" size={18} />
        Data master
      </button>
    </div>
  );
}

function ReportPanel({
  date,
  reports,
  ready,
  error,
  onDateChange,
  onCopyOutlet,
  onCopyAll,
}: {
  date: string;
  reports: OutletReport[];
  ready: boolean;
  error: string;
  onDateChange: (date: string) => void;
  onCopyOutlet: (report: OutletReport) => void;
  onCopyAll: (reports: OutletReport[]) => void;
}) {
  const [outletFilter, setOutletFilter] = useState("");
  const activeFilter = reports.some((report) => report.outletName === outletFilter)
    ? outletFilter
    : "";
  const visible = activeFilter
    ? reports.filter((report) => report.outletName === activeFilter)
    : reports;
  const totalSales = visible.reduce((sum, report) => sum + report.total, 0);
  const totalItems = visible.reduce((sum, report) => sum + report.itemCount, 0);
  const totalTransactions = visible.reduce(
    (sum, report) => sum + report.transactionCount,
    0,
  );

  return (
    <section className="report-page" aria-label="Laporan barang laku per ruko">
      <div className="panel">
        <div className="report-toolbar">
          <div>
            <h2 className="panel-title">Barang laku per ruko</h2>
            <p className="panel-subtitle">
              Setiap ruko punya daftar barang lakunya sendiri, sesuai data yang
              disimpan dari kasir.
            </p>
          </div>
          <div className="report-filters">
            <label className="report-date">
              <Icon name="calendar" size={15} />
              <span>Tanggal</span>
              <input
                aria-label="Tanggal laporan"
                className="date-input"
                onChange={(event) => onDateChange(event.target.value)}
                type="date"
                value={date}
              />
            </label>
            <label className="report-date">
              <Icon name="search" size={15} />
              <span>Ruko</span>
              <select
                aria-label="Filter ruko"
                className="date-input"
                onChange={(event) => setOutletFilter(event.target.value)}
                value={activeFilter}
              >
                <option value="">Semua ruko</option>
                {reports.map((report) => (
                  <option key={report.outletName} value={report.outletName}>
                    {report.outletName}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </div>
        <div className="report-footer">
          <span>
            {visible.length} ruko <strong>·</strong> {totalItems} item terjual{" "}
            <strong>·</strong> {totalTransactions} transaksi
          </span>
          <span>
            Total penjualan: <strong>{formatRupiah(totalSales)}</strong>
          </span>
          <button
            className="primary-button copy-button"
            disabled={visible.length === 0}
            onClick={() => onCopyAll(visible)}
            type="button"
          >
            <Icon name="copy" size={15} />
            Salin semua ruko
          </button>
        </div>
      </div>

      {visible.length === 0 ? (
        <div className="panel empty-report">
          {error
            ? "Laporan belum dapat dimuat dari database. Perbaiki koneksi atau izin, lalu muat ulang aplikasi."
            : !ready
              ? "Memuat laporan dari database..."
              : (
                  <>
                    Belum ada barang terjual pada tanggal ini.
                    <br />
                    Penjualan yang disimpan dari kasir akan muncul di sini,
                    dipisah per ruko.
                  </>
                )}
        </div>
      ) : (
        visible.map((report) => (
          <article className="panel outlet-report-card" key={report.outletName}>
            <header className="outlet-report-header">
              <div>
                <h3 className="outlet-report-name">{report.outletName}</h3>
                <p className="panel-subtitle">
                  {report.transactionCount} transaksi · {report.itemCount} item
                </p>
              </div>
              <button
                className="secondary-button"
                onClick={() => onCopyOutlet(report)}
                type="button"
              >
                <Icon name="copy" size={14} />
                Salin laporan
              </button>
            </header>
            <div className="table-scroll">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>BARANG</th>
                    <th>SATUAN</th>
                    <th>JUMLAH</th>
                    <th>HARGA / UNIT</th>
                    <th>SUBTOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  {report.lines.map((line) => (
                    <tr key={`${line.productId}:${line.tierId}`}>
                      <td>{line.productName}</td>
                      <td>{line.tierLabel}</td>
                      <td>{line.quantity}</td>
                      <td>{formatRupiah(line.unitPrice)}</td>
                      <td>{formatRupiah(line.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="outlet-report-totals">
              <div>
                <span>TOTAL</span>
                <strong>{formatRupiah(report.total)}</strong>
              </div>
              {report.hasDeposit && (
                <div>
                  <span>TITIP</span>
                  <strong>{formatRupiah(report.deposit)}</strong>
                </div>
              )}
              <div>
                <span>TOTAL TF</span>
                <strong>{formatRupiah(report.transfer)}</strong>
              </div>
              <div>
                <span>ADMIN</span>
                <strong>{formatRupiah(report.admin)}</strong>
              </div>
            </div>
          </article>
        ))
      )}
    </section>
  );
}