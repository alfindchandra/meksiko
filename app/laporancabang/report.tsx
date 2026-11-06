"use client";

import { toJpeg } from "html-to-image";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { supabase } from "../lib/supabase";
import { localDateKey, SaleLine } from "../lib/sales";

type Outlet = { id: string; name: string };
type Expense = { id: string; description: string; amount: number };
type ProductTier = { id: string; label: string; price: number };
type CatalogProduct = {
  id: string;
  name: string;
  category: string;
  tiers: ProductTier[];
};
type SalesRow = {
  id: string;
  created_at: string;
  outlet_name: string;
  amount_received: number | null;
  transfer_amount: number | null;
  admin_amount: number | null;
  lines: unknown[];
};
type ReportProduct = {
  key: string;
  productId: string;
  tierId: string;
  productName: string;
  quantity: number;
  tierLabel: string;
  unitPrice: number;
};
type SavedReport = {
  previous_cash: number;
  deposit_amount: number;
  admin_fee: number;
  expenses: unknown;
  sales_lines?: unknown;
  stock_values: unknown;
};

function isSalesRow(value: unknown): value is SalesRow {
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

function parseExpenses(value: unknown): Expense[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const expense = item as Record<string, unknown>;
    if (
      typeof expense.description !== "string" ||
      typeof expense.amount !== "number" ||
      !Number.isFinite(expense.amount) ||
      expense.amount < 0
    ) {
      return [];
    }
    return [{
      id: typeof expense.id === "string" ? expense.id : crypto.randomUUID(),
      description: expense.description,
      amount: expense.amount,
    }];
  });
}

function parseStockValues(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(
      (entry): entry is [string, string] => typeof entry[1] === "string",
    ),
  );
}

function parseSavedSalesLines(
  value: unknown,
  catalog: CatalogProduct[],
): ReportProduct[] | null {
  if (!Array.isArray(value)) return null;
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const line = item as Record<string, unknown>;
    if (
      typeof line.key !== "string" ||
      typeof line.productId !== "string" ||
      typeof line.tierId !== "string" ||
      typeof line.quantity !== "number" ||
      !Number.isInteger(line.quantity) ||
      line.quantity < 1 ||
      typeof line.unitPrice !== "number" ||
      !Number.isFinite(line.unitPrice) ||
      line.unitPrice < 0
    ) {
      return [];
    }

    const product = catalog.find((entry) => entry.id === line.productId);
    const tier = product?.tiers.find((entry) => entry.id === line.tierId);
    if (!product || !tier) return [];
    return [{
      key: line.key,
      productId: product.id,
      tierId: tier.id,
      productName: product.name,
      quantity: line.quantity,
      tierLabel: tier.label,
      unitPrice: line.unitPrice,
    }];
  });
}

function createEmptyLine(): ReportProduct {
  return {
    key: crypto.randomUUID(),
    productId: "",
    tierId: "",
    productName: "",
    quantity: 1,
    tierLabel: "",
    unitPrice: 0,
  };
}

function localDateRange(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);
  return { start: start.toISOString(), end: end.toISOString() };
}

function fullDate(date: string) {
  if (!date) return "";
  const value = new Date(`${date}T12:00:00`);
  return value.toLocaleDateString("id-ID", { day: "numeric", month: "long" });
}

function subscribeToDateChange(callback: () => void) {
  const interval = window.setInterval(callback, 60_000);
  window.addEventListener("focus", callback);
  return () => {
    window.clearInterval(interval);
    window.removeEventListener("focus", callback);
  };
}

function useCurrentDate() {
  return useSyncExternalStore(
    subscribeToDateChange,
    () => localDateKey(new Date()),
    () => "",
  );
}

function normalizeSales(
  rows: SalesRow[],
  catalog: CatalogProduct[],
): ReportProduct[] {
  const products = new Map<string, ReportProduct>();
  for (const transaction of rows) {
    for (const rawLine of transaction.lines) {
      if (!rawLine || typeof rawLine !== "object") continue;
      const line = rawLine as Partial<SaleLine>;
      if (
        typeof line.productId !== "string" ||
        typeof line.productName !== "string" ||
        typeof line.tierId !== "string" ||
        typeof line.tierLabel !== "string" ||
        typeof line.quantity !== "number" ||
        typeof line.unitPrice !== "number" ||
        !Number.isFinite(line.quantity) ||
        !Number.isFinite(line.unitPrice)
      ) {
        continue;
      }

      const catalogProduct = catalog.find(
        (product) => product.id === line.productId,
      );
      const catalogTier = catalogProduct?.tiers.find(
        (tier) => tier.id === line.tierId,
      );
      if (!catalogProduct || !catalogTier) continue;

      const key = `${line.productId}:${line.tierId}`;
      const current = products.get(key);
      if (current) {
        current.quantity += line.quantity;
      } else {
        products.set(key, {
          key,
          productId: line.productId,
          tierId: line.tierId,
          productName: catalogProduct.name,
          quantity: line.quantity,
          tierLabel: catalogTier.label,
          unitPrice: catalogTier.price,
        });
      }
    }
  }
  return [...products.values()].sort((a, b) =>
    a.productName.localeCompare(b.productName, "id-ID"),
  );
}

function normalizeCatalogRows(rows: unknown[]): CatalogProduct[] {
  return rows.flatMap((value) => {
    if (!value || typeof value !== "object") return [];
    const row = value as Record<string, unknown>;
    if (
      (typeof row.id !== "number" && typeof row.id !== "string") ||
      typeof row.name !== "string" ||
      typeof row.category !== "string" ||
      !Array.isArray(row.price_tiers)
    ) {
      return [];
    }

    const tiers = row.price_tiers.flatMap((value) => {
      if (!value || typeof value !== "object") return [];
      const tier = value as Record<string, unknown>;
      if (
        typeof tier.tier_code !== "string" ||
        typeof tier.tier_name !== "string" ||
        typeof tier.price_idr !== "number"
      ) {
        return [];
      }
      return [{
        id: tier.tier_code,
        label: tier.tier_name,
        price: tier.price_idr,
      }];
    });

    return [{
      id: String(row.id),
      name: row.name,
      category: row.category,
      tiers,
    }];
  });
}

function MoneyInput({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <input
      aria-label={label}
      className="w-full min-w-0 bg-transparent text-right tabular-nums outline-none print:placeholder-transparent"
      inputMode="numeric"
      onChange={(event) =>
        onChange(Number(event.target.value.replace(/\D/g, "")) || 0)
      }
      placeholder="0"
      value={value ? new Intl.NumberFormat("id-ID").format(value) : ""}
    />
  );
}

function ProductSearch({
  catalog,
  selectedName,
  onSelect,
  label,
}: {
  catalog: CatalogProduct[];
  selectedName: string;
  onSelect: (productId: string) => void;
  label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const [active, setActive] = useState(0);
  const [rect, setRect] = useState({ left: 0, top: 0, width: 220 });

  const trimmed = query.trim();
  const isOpen = focused && trimmed !== "";
  const results = useMemo(() => {
    const q = trimmed.toLocaleLowerCase("id-ID");
    if (!q) return [];
    return catalog
      .filter(
        (item) =>
          item.tiers.length > 0 &&
          item.name.toLocaleLowerCase("id-ID").includes(q),
      )
      .slice(0, 8);
  }, [catalog, trimmed]);

  useEffect(() => {
    if (!isOpen) return;
    const close = () => inputRef.current?.blur();
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [isOpen]);

  function updatePosition() {
    const box = inputRef.current?.getBoundingClientRect();
    if (!box) return;
    setRect({
      left: box.left,
      top: box.bottom + 2,
      width: Math.max(box.width, 220),
    });
  }

  function choose(productId: string) {
    onSelect(productId);
    setQuery("");
    inputRef.current?.blur();
  }

  return (
    <div className="min-w-0 flex-1">
      <input
        aria-label={label}
        autoComplete="off"
        className="w-full min-w-0 bg-transparent px-0.5 font-semibold outline-none placeholder:font-normal placeholder:text-slate-400 print:placeholder-transparent"
        onBlur={() => {
          setFocused(false);
          setQuery("");
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setActive(0);
          updatePosition();
        }}
        onFocus={() => {
          setFocused(true);
          setQuery("");
          updatePosition();
        }}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown") {
            event.preventDefault();
            setActive((current) => Math.min(current + 1, results.length - 1));
          } else if (event.key === "ArrowUp") {
            event.preventDefault();
            setActive((current) => Math.max(current - 1, 0));
          } else if (event.key === "Enter") {
            event.preventDefault();
            if (results[active]) choose(results[active].id);
          } else if (event.key === "Escape") {
            inputRef.current?.blur();
          }
        }}
        placeholder={selectedName || "Cari produk..."}
        ref={inputRef}
        type="text"
        value={focused ? query : selectedName}
      />
      {isOpen && (
        <ul
          className="no-export fixed z-50 max-h-60 overflow-auto rounded-md border border-slate-300 bg-white py-1 text-[13px] shadow-lg"
          role="listbox"
          style={{ left: rect.left, top: rect.top, width: rect.width }}
        >
          {results.length === 0 ? (
            <li className="px-3 py-2 text-slate-500">Produk tidak ditemukan</li>
          ) : (
            results.map((item, resultIndex) => (
              <li
                aria-selected={resultIndex === active}
                className={`cursor-pointer px-3 py-1.5 ${resultIndex === active ? "bg-emerald-100" : "hover:bg-emerald-50"}`}
                key={item.id}
                onMouseDown={(event) => {
                  event.preventDefault();
                  choose(item.id);
                }}
                onMouseEnter={() => setActive(resultIndex)}
                role="option"
              >
                {item.name}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}

export default function BranchReport() {
  const [outletQuery, setOutletQuery] = useState("");
  const [outletFocused, setOutletFocused] = useState(false);
  const [outletActiveIndex, setOutletActiveIndex] = useState(0);
  const [outletRect, setOutletRect] = useState({ left: 0, top: 0, width: 220 });
  const outletInputRef = useRef<HTMLInputElement>(null);
  const reportRef = useRef<HTMLDivElement>(null);
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [outletName, setOutletName] = useState("");
  const currentDate = useCurrentDate();
  const [selectedDate, setSelectedDate] = useState("");
  const reportDate = selectedDate || currentDate;
  const [products, setProducts] = useState<ReportProduct[]>([]);
  const [previousCash, setPreviousCash] = useState(0);
  const [depositAmount, setDepositAmount] = useState(0);
  const [adminFee, setAdminFee] = useState(0);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stockValues, setStockValues] = useState<Record<string, string>>({});
  const [transferTotal, setTransferTotal] = useState(0);
  const [loadError, setLoadError] = useState("");
  const [catalogError, setCatalogError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [notice, setNotice] = useState("");

  function updateOutletPosition() {
    const box = outletInputRef.current?.getBoundingClientRect();
    if (!box) return;
    setOutletRect({
      left: box.left,
      top: box.bottom + 2,
      width: Math.max(box.width, 220),
    });
  }
  useEffect(() => {
    let active = true;
    async function loadOutlets() {
      const { data, error } = await supabase
        .from("rukos")
        .select("id, name")
        .order("name");
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select(
          "id, name, category, price_tiers(tier_code, tier_name, price_idr)",
        )
        .order("name");
      if (!active) return;
      if (error) {
        setLoadError(`Daftar ruko gagal dimuat dari database: ${error.message}`);
        setIsLoading(false);
        return;
      }
      if (productError) {
        setCatalog([]);
        setCatalogError(
          `Daftar produk dan harga gagal dimuat dari database: ${productError.message}`,
        );
      } else {
        const nextCatalog = normalizeCatalogRows(productData ?? []);
        setCatalog(nextCatalog);
        setCatalogError(
          nextCatalog.length === 0
            ? "Belum ada produk dengan tier harga di data master database."
            : "",
        );
      }
      const nextOutlets = (data ?? []).map((row) => ({
        id: String(row.id),
        name: row.name,
      }));
      setOutlets(nextOutlets);
      setOutletName((current) =>
        nextOutlets.some((outlet) => outlet.name === current)
          ? current
          : nextOutlets.find((outlet) => outlet.name === "SUGIHWARAS")?.name ??
            nextOutlets[0]?.name ??
            "",
      );
      if (nextOutlets.length === 0) {
        setLoadError("Belum ada data cabang di database.");
        setIsLoading(false);
      }
    }
    void loadOutlets().catch((error: unknown) => {
      if (!active) return;
      const message =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
      setLoadError(`Daftar cabang gagal dimuat: ${message}`);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!outletName || !reportDate) return;
    let active = true;
    async function loadReport() {
      setIsLoading(true);
      setLoadError("");
      const { start, end } = localDateRange(reportDate);
      const [salesResponse, savedResponse] = await Promise.all([
        supabase
          .from("sales_transactions")
          .select(
            "id, created_at, outlet_name, amount_received, transfer_amount, admin_amount, lines",
          )
          .eq("outlet_name", outletName)
          .gte("created_at", start)
          .lt("created_at", end)
          .order("created_at"),
        supabase
          .from("branch_daily_reports")
          .select(
            "previous_cash, deposit_amount, admin_fee, expenses, sales_lines, stock_values",
          )
          .eq("report_date", reportDate)
          .eq("outlet_name", outletName)
          .maybeSingle(),
      ]);
      if (!active) return;

      if (salesResponse.error) {
        setLoadError(`Transaksi gagal dimuat: ${salesResponse.error.message}`);
        setProducts([]);
        setIsLoading(false);
        return;
      }

      const rows = (salesResponse.data ?? []).filter(isSalesRow);
      const sales = normalizeSales(rows, catalog);
      const transfer = rows.reduce(
        (sum, row) => sum + (row.transfer_amount ?? 0),
        0,
      );
      const received = rows.reduce(
        (sum, row) => sum + (row.amount_received ?? 0),
        0,
      );
      const admin = rows.reduce(
        (sum, row) => sum + (row.admin_amount ?? 0),
        0,
      );
      let saved = savedResponse.data as SavedReport | null;
      let reportError = "";
      if (savedResponse.error) {
        if (savedResponse.error.message.includes("sales_lines")) {
          const legacyResponse = await supabase
            .from("branch_daily_reports")
            .select(
              "previous_cash, deposit_amount, admin_fee, expenses, stock_values",
            )
            .eq("report_date", reportDate)
            .eq("outlet_name", outletName)
            .maybeSingle();
          if (legacyResponse.error) {
            reportError = `Rekap keuangan belum dapat dimuat: ${legacyResponse.error.message}`;
          } else {
            saved = legacyResponse.data as SavedReport | null;
            reportError =
              "Agar baris produk dan harga tersimpan, jalankan migrasi Supabase untuk menambahkan kolom sales_lines.";
          }
        } else {
          reportError = `Rekap keuangan belum dapat dimuat: ${savedResponse.error.message}`;
        }
      }

      const savedSales = saved
        ? parseSavedSalesLines(saved.sales_lines, catalog)
        : null;
      setProducts(
        savedSales ?? (sales.length > 0 ? sales : [createEmptyLine()]),
      );
      setTransferTotal(transfer);
      setPreviousCash(saved?.previous_cash ?? 0);
      setDepositAmount(saved?.deposit_amount ?? received);
      setAdminFee(saved?.admin_fee ?? admin);
      setExpenses(parseExpenses(saved?.expenses));
      setStockValues(parseStockValues(saved?.stock_values));
      setLoadError(reportError);
      setIsLoading(false);
    }

    void loadReport().catch((error: unknown) => {
      if (!active) return;
      const message =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
      setLoadError(`Laporan gagal dimuat: ${message}`);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, [catalog, outletName, reportDate]);

  const salesTotal = useMemo(
    () =>
      products.reduce(
        (sum, product) =>
          sum + (product.productId ? product.quantity * product.unitPrice : 0),
        0,
      ),
    [products],
  );
  const expenseTotal = useMemo(
    () => expenses.reduce((sum, expense) => sum + expense.amount, 0),
    [expenses],
  );
  const totalFunds = previousCash + salesTotal;
  const endingCash =
    totalFunds - transferTotal - depositAmount - adminFee - expenseTotal;
  const dateLabel = fullDate(reportDate);
  const uppercaseOutlet = outletName.trim().toLocaleUpperCase("id-ID");
  const branchLabel = uppercaseOutlet.startsWith("MEKSIKO ")
    ? uppercaseOutlet
    : `MEKSIKO ${uppercaseOutlet}`;
  const rowCount = Math.max(12, products.length + 2, expenses.length + 9);

const reportRows = useMemo(() => {
    const lines: Array<{
      type: "fixed" | "expense" | "blank" | "ending";
      label?: string;
      amount?: number;
      expense?: Expense;
      isBold?: boolean; // Tambahkan properti opsional ini
    }> = [
      { type: "fixed", label: "SISA UANG SEBELUMNYA", amount: previousCash },
      {
        type: "fixed",
        label: `PENJUALAN TGL ${dateLabel.toLocaleUpperCase("id-ID")}`,
        amount: salesTotal,
      },
      { type: "fixed", label: "TOTAL", amount: totalFunds }, 
      { type: "blank" },
      { type: "fixed", label: "SETOR", amount: depositAmount, isBold: true }, 
      { type: "fixed", label: "BIAYA ADMIN", amount: adminFee },
      { type: "fixed", label: "PENGELUARAN" },
      ...expenses.map((expense) => ({
        type: "expense" as const,
        expense,
      })),
    ];
    while (lines.length < rowCount - 1) lines.push({ type: "blank" });
    lines.push({ type: "ending", label: "JUMLAH AKHIR UANG", amount: endingCash });
    return lines;
  }, [
    adminFee,
    dateLabel,
    depositAmount,
    endingCash,
    expenses,
    previousCash,
    rowCount,
    salesTotal,
    totalFunds,
    transferTotal,
  ]);

  const updateExpense = useCallback(
    (id: string, patch: Partial<Expense>) => {
      setExpenses((current) =>
        current.map((expense) =>
          expense.id === id ? { ...expense, ...patch } : expense,
        ),
      );
    },
    [],
  );

  function addExpense() {
    setExpenses((current) => [
      ...current,
      { id: crypto.randomUUID(), description: "", amount: 0 },
    ]);
  }

  function addProductLine() {
    setProducts((current) => [...current, createEmptyLine()]);
  }

  function updateProductLine(
    key: string,
    patch: Partial<ReportProduct>,
  ) {
    setProducts((current) =>
      current.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  }

  function selectProduct(key: string, productId: string) {
    const product = catalog.find((item) => item.id === productId);
    
    // Cari tier "btl" atau ambil tier pertama jika "btl" tidak ditemukan
    const tier = 
      product?.tiers.find((item) => 
        item.label.toLocaleLowerCase("id-ID").includes("btl") ||
        item.id.toLocaleLowerCase("id-ID").includes("btl")
      ) ?? product?.tiers[0];

    updateProductLine(key, {
      productId,
      productName: product?.name ?? "",
      tierId: tier?.id ?? "",
      tierLabel: tier?.label ?? "",
      unitPrice: tier?.price ?? 0,
    });
  }

  function selectTier(key: string, productId: string, tierId: string) {
    const product = catalog.find((item) => item.id === productId);
    const tier = product?.tiers.find((item) => item.id === tierId);
    if (!tier) return;
    updateProductLine(key, {
      tierId: tier.id,
      tierLabel: tier.label,
      unitPrice: tier.price,
    });
  }

  async function saveReport() {
    if (!outletName) return;
    setIsSaving(true);
    setNotice("");
    try {
      const { error } = await supabase.from("branch_daily_reports").upsert(
        {
          report_date: reportDate,
          outlet_name: outletName,
          previous_cash: previousCash,
          deposit_amount: depositAmount,
          admin_fee: adminFee,
          expenses: expenses.map(({ description, amount }) => ({
            description: description.trim(),
            amount,
          })),
          sales_lines: products
            .filter((line) => line.productId && line.quantity > 0)
            .map(({ key, productId, tierId, quantity, unitPrice }) => ({
              key,
              productId,
              tierId,
              quantity,
              unitPrice,
            })),
          stock_values: stockValues,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "report_date,outlet_name" },
      );
      if (error) throw error;
      setLoadError("");
      setNotice("Rekap dan sisa stok berhasil disimpan.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
      setLoadError(
        `Rekap gagal disimpan ke database: ${message}. Jalankan migrasi Supabase terbaru.`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function exportJpg() {
    if (!reportRef.current) return;
    setIsExporting(true);
    setNotice("");
    try {
      await document.fonts.ready;
      const dataUrl = await toJpeg(reportRef.current, {
        backgroundColor: "#ffffff",
        cacheBust: true,
        filter: (node) =>
          !(node instanceof HTMLElement && node.classList.contains("no-export")),
        pixelRatio: 2,
        quality: 0.96,
      });
      const link = document.createElement("a");
      link.download = `laporan-${outletName
        .toLocaleLowerCase("id-ID")
        .replace(/[^a-z0-9]+/g, "-")}-${reportDate}.jpg`;
      link.href = dataUrl;
      link.click();
      setNotice("Laporan berhasil diekspor sebagai JPG.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Gagal membuat gambar.";
      setLoadError(`Ekspor JPG gagal: ${message}`);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 px-3 py-5 text-slate-900 sm:px-6 sm:py-8">
      <div className="mx-auto max-w-[1680px]">
        <header className="mb-5 flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-end sm:justify-between sm:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-700">
              Meksiko Store
            </p>
            <h1 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">
              Laporan cabang
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Laporan penjualan dan rekap uang harian.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-[minmax(190px,1fr)_180px_auto_auto] sm:items-end">
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              <div className="relative grid gap-1 text-xs font-semibold text-slate-600">
              Cabang / ruko
              <input
                aria-label="Cari cabang atau ruko"
                autoComplete="off"
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 outline-none placeholder:text-slate-400"
                onBlur={() => {
                  setOutletFocused(false);
                  setOutletQuery("");
                }}
                onChange={(event) => {
                  setOutletQuery(event.target.value);
                  setOutletActiveIndex(0);
                  updateOutletPosition();
                }}
                onFocus={() => {
                  setOutletFocused(true);
                  setOutletQuery("");
                  updateOutletPosition();
                }}
                onKeyDown={(event) => {
                  const filtered = outlets.filter((item) =>
                    item.name.toLocaleLowerCase("id-ID").includes(outletQuery.trim().toLocaleLowerCase("id-ID"))
                  );
                  if (event.key === "ArrowDown") {
                    event.preventDefault();
                    setOutletActiveIndex((current) => Math.min(current + 1, filtered.length - 1));
                  } else if (event.key === "ArrowUp") {
                    event.preventDefault();
                    setOutletActiveIndex((current) => Math.max(current - 1, 0));
                  } else if (event.key === "Enter") {
                    event.preventDefault();
                    if (filtered[outletActiveIndex]) {
                      setOutletName(filtered[outletActiveIndex].name);
                      setOutletQuery("");
                      outletInputRef.current?.blur();
                    }
                  } else if (event.key === "Escape") {
                    outletInputRef.current?.blur();
                  }
                }}
                placeholder={outletName || "Cari cabang..."}
                ref={outletInputRef}
                type="text"
                value={outletFocused ? outletQuery : outletName}
              />
              {outletFocused && (
                <ul
                  className="no-export fixed z-50 max-h-60 overflow-auto rounded-md border border-slate-300 bg-white py-1 text-[13px] shadow-lg"
                  role="listbox"
                  style={{ left: outletRect.left, top: outletRect.top, width: outletRect.width }}
                >
                  {outlets.filter((item) =>
                    item.name.toLocaleLowerCase("id-ID").includes(outletQuery.trim().toLocaleLowerCase("id-ID"))
                  ).length === 0 ? (
                    <li className="px-3 py-2 text-slate-500">Cabang tidak ditemukan</li>
                  ) : (
                    outlets
                      .filter((item) =>
                        item.name.toLocaleLowerCase("id-ID").includes(outletQuery.trim().toLocaleLowerCase("id-ID"))
                      )
                      .map((item, resultIndex) => (
                        <li
                          aria-selected={resultIndex === outletActiveIndex}
                          className={`cursor-pointer px-3 py-1.5 ${
                            resultIndex === outletActiveIndex ? "bg-emerald-100" : "hover:bg-emerald-50"
                          }`}
                          key={item.id}
                          onMouseDown={(event) => {
                            event.preventDefault();
                            setOutletName(item.name);
                            setOutletQuery("");
                            outletInputRef.current?.blur();
                          }}
                          onMouseEnter={() => setOutletActiveIndex(resultIndex)}
                          role="option"
                        >
                          {item.name}
                        </li>
                      ))
                  )}
                </ul>
              )}
            </div>


            </label>
            <label className="grid gap-1 text-xs font-semibold text-slate-600">
              Tanggal laporan
              <input
                className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900"
                onChange={(event) => setSelectedDate(event.target.value)}
                type="date"
                value={reportDate}
              />
            </label>
            
            <button
              className="h-10 rounded-lg border border-slate-300 bg-green-800 px-4 text-sm font-bold text-white transition hover:bg-green-600 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isExporting || !outletName}
              onClick={exportJpg}
              type="button"
            >
              {isExporting ? "Membuat JPG..." : "Unduh JPG"}
            </button>
          </div>
        </header>

        {(loadError || catalogError) && (
          <div
            className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
            role="alert"
          >
            {[loadError, catalogError].filter(Boolean).join(" ")}
          </div>
        )}
        {notice && (
          <div
            className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
            role="status"
          >
            {notice}
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-300 bg-white shadow-sm">
          <section
            aria-label="Laporan penjualan dan rekap keuangan"
            className="grid min-w-[1400px] grid-cols-[1.3fr_0.7fr] gap-8 bg-white p-3 text-[13px] text-black sm:p-5 lg:gap-10 lg:p-7"
            ref={reportRef}
          >
            <div className="min-w-0">
              <div className="flex h-[54px] flex-col items-center justify-center border border-b-0 border-slate-300 text-center font-bold leading-tight">
                <h2 className="text-[17px]">LAPORAN PENJUALAN</h2>
                <p className="text-[16px]">{branchLabel || "CABANG"}</p>
              </div>
              <table className="w-full table-fixed border-collapse border border-slate-500">
                <thead>
                  <tr className="h-[34px] bg-[#dcebe5] text-center text-[12px] font-bold sm:text-[14px]">
                    <th className="w-[14%] border border-slate-500 px-1">TANGGAL</th>
                    <th className="w-[29%] border border-slate-500 px-1">NAMA PRODUCT</th>
                    <th className="w-[21%] border border-slate-500 px-1">JUMLAH</th>
                    <th className="w-[20%] border border-slate-500 px-1">NOMINAL</th>
                    <th className="w-[16%] border border-slate-500 px-1">SISA STOK</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: rowCount - 1 }, (_, index) => {
                    const product = products[index];
                    const selectedCatalogProduct = catalog.find(
                      (item) => item.id === product?.productId,
                    );
                    return (
                      <tr className="h-[34px]" key={product?.key ?? `empty-${index}`}>
                        <td className="border border-slate-400 px-1.5 text-center">
                          {product && index === 0 ? dateLabel : ""}
                        </td>
                        <td className="border border-slate-400 px-1">
                          {product ? (
                            <div className="flex items-center gap-1">
                              <ProductSearch
                                catalog={catalog}
                                label={`Cari nama produk baris ${index + 1}`}
                                onSelect={(productId) =>
                                  selectProduct(product.key, productId)
                                }
                                selectedName={product.productName}
                              />
                              <button
                                aria-label={`Hapus produk baris ${index + 1}`}
                                className="no-export px-1 text-red-700"
                                onClick={() =>
                                  setProducts((current) =>
                                    current.filter((line) => line.key !== product.key),
                                  )
                                }
                                type="button"
                              >
                                ×
                              </button>
                            </div>
                          ) : index === products.length ? (
                            <button
                              className="no-export rounded border border-emerald-700 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-800 hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
                              disabled={isLoading || catalog.length === 0}
                              onClick={addProductLine}
                              type="button"
                            >
                              + Tambah produk
                            </button>
                          ) : null}
                        </td>
                        <td className="border border-slate-400 px-1">
                          {product?.productId && selectedCatalogProduct ? (
                            <div className="flex items-center gap-1">
                              <input
                                aria-label={`Jumlah produk baris ${index + 1}`}
                                className="w-12 shrink-0 bg-transparent text-center outline-none"
                                inputMode="numeric"
                                onChange={(event) =>
                                  updateProductLine(product.key, {
                                    quantity:
                                      Number(event.target.value.replace(/\D/g, "")) || 0,
                                  })
                                }
                                value={product.quantity || ""}
                              />
                              <select
                                aria-label={`Tier harga baris ${index + 1}`}
                                className="min-w-0 flex-1 appearance-none bg-transparent p-0 text-[11px] outline-none"
                                onChange={(event) =>
                                  selectTier(
                                    product.key,
                                    product.productId,
                                    event.target.value,
                                  )
                                }
                                value={product.tierId}
                              >
                                {selectedCatalogProduct.tiers.map((tier) => (
                                  <option key={tier.id} value={tier.id}>
                                    {tier.label}
                                  </option>
                                ))}
                              </select>
                            </div>
                          ) : product ? (
                            <input
                              aria-label={`Jumlah produk baris ${index + 1}`}
                              className="w-full bg-transparent text-center outline-none"
                              inputMode="numeric"
                              onChange={(event) =>
                                updateProductLine(product.key, {
                                  quantity:
                                    Number(event.target.value.replace(/\D/g, "")) || 0,
                                })
                              }
                              value={product.quantity || ""}
                            />
                          ) : null}
                        </td>
                        <td className="border border-slate-400 px-1.5 text-right tabular-nums">
                          {product?.productId
                            ? new Intl.NumberFormat("id-ID").format(
                                product.quantity * product.unitPrice,
                              )
                            : ""}
                        </td>
                        <td className="border border-slate-400 px-1.5">
                          {product?.productId ? (
                            <input
                              aria-label={`Sisa stok ${product.productName}`}
                              className="w-full bg-transparent text-center tabular-nums outline-none"
                              inputMode="numeric"
                              onChange={(event) =>
                                setStockValues((current) => ({
                                  ...current,
                                  [product.key]: event.target.value.replace(/\D/g, ""),
                                }))
                              }
                              value={stockValues[product.key] ?? ""}
                            />
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="h-[36px] font-bold">
                    <td className="border border-slate-400" colSpan={3} />
                    <td className="border border-slate-400 px-1.5 text-right tabular-nums">
                      {new Intl.NumberFormat("id-ID").format(salesTotal)}
                    </td>
                    <td className="border border-slate-400" />
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="min-w-0">
              <div className="flex h-[54px] flex-col items-center justify-center border border-b-0 border-slate-300 text-center font-bold leading-tight">
                <h2 className="text-[17px]">LAPORAN REKAP</h2>
                <p className="text-[16px]">{branchLabel || "CABANG"}</p>
              </div>
              <table className="w-full table-fixed border-collapse border border-slate-500">
                <thead>
                  <tr className="h-[34px] bg-[#dcebe5] text-center text-[12px] font-bold sm:text-[14px]">
                    <th className="w-[24%] border border-slate-500 px-1">TANGGAL</th>
                    <th className="w-[42%] border border-slate-500 px-1">KETERANGAN</th>
                    <th className="w-[34%] border border-slate-500 px-1">JUMLAH UANG</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.map((row, index) => (
                  <tr
                      className={`h-[34px] ${
                        row.type === "ending" || row.isBold ? "font-bold" : ""
                      } ${row.label === "TOTAL" ? "font-semibold" : ""}`}
                      key={`${row.type}-${row.expense?.id ?? row.label ?? index}-${index}`}
                    >
                      <td className="border border-slate-600 px-1.5 text-center">
                        {row.type !== "blank" && row.type !== "ending" && index === 0
                          ? dateLabel
                          : ""}
                      </td>
                      <td className="border border-slate-400 px-1.5">
                        {row.type === "expense" && row.expense ? (
                          <div className="flex items-center gap-1">
                            <input
                              aria-label="Keterangan pengeluaran"
                              className="w-full min-w-0 bg-transparent outline-none"
                              onChange={(event) =>
                                updateExpense(row.expense!.id, {
                                  description: event.target.value,
                                })
                              }
                              placeholder="Nama pengeluaran"
                              value={row.expense.description}
                            />
                            <button
                              aria-label="Hapus pengeluaran"
                              className="no-export text-red-700"
                              onClick={() =>
                                setExpenses((current) =>
                                  current.filter((item) => item.id !== row.expense!.id),
                                )
                              }
                              type="button"
                            >
                              ×
                            </button>
                          </div>
                        ) : row.label === "PENGELUARAN" ? (
                          <span className="flex items-center justify-between">
                            PENGELUARAN
                            <button
                              className="no-export rounded border border-emerald-700 px-1.5 text-xs font-bold text-emerald-800"
                              onClick={addExpense}
                              type="button"
                            >
                              + Tambah
                            </button>
                          </span>
                        ) : (
                          row.label
                        )}
                      </td>
                      <td className="border border-slate-400 px-1.5 text-right tabular-nums">
                        {row.type === "expense" && row.expense ? (
                          <MoneyInput
                            label="Nominal pengeluaran"
                            onChange={(amount) =>
                              updateExpense(row.expense!.id, { amount })
                            }
                            value={row.expense.amount}
                          />
                        ) : row.label === "SISA UANG SEBELUMNYA" ? (
                          <MoneyInput
                            label="Sisa uang sebelumnya"
                            onChange={setPreviousCash}
                            value={previousCash}
                          />
                        ) : row.label === "SETOR" ? (
                          <MoneyInput
                            label="Setor"
                            onChange={setDepositAmount}
                            value={depositAmount}
                          />
                        ) : row.label === "BIAYA ADMIN" ? (
                          <MoneyInput
                            label="Biaya admin"
                            onChange={setAdminFee}
                            value={adminFee}
                          />
                        ) : row.amount !== undefined ? (
                          new Intl.NumberFormat("id-ID").format(row.amount)
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {isLoading && (
          <p className="mt-3 text-center text-sm text-slate-500">
            Memuat transaksi dan rekap dari database...
          </p>
        )}
        {!isLoading && !loadError && products.length === 0 && (
          <p className="mt-3 text-center text-sm text-slate-500">
            Belum ada transaksi untuk cabang dan tanggal yang dipilih. Rekap masih
            dapat diisi dan disimpan.
          </p>
        )}
        <p className="mt-3 text-center text-xs text-slate-500">
          Jumlah akhir uang = sisa sebelumnya + penjualan − setor −
          biaya admin − pengeluaran.
        </p>
      </div>
    </main>
  );
}