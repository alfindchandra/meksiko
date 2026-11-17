"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";

type CoffeeMenu = {
  id: string;
  name: string;
  isSubRecipe: boolean;
};

type CoffeeIngredient = {
  id: string;
  name: string;
  unit: "gr" | "ml";
};

type CoffeeRecipe = {
  id: string;
  menuId: string;
  ingredientId: string;
  amount: number;
};

type IngredientUsage = {
  ingredient: CoffeeIngredient;
  totalScaled: number;
  sources: { menuName: string; amountScaled: number }[];
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeMenus(value: unknown): CoffeeMenu[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row): CoffeeMenu[] => {
    if (
      !isRecord(row) ||
      (typeof row.id !== "string" && typeof row.id !== "number") ||
      typeof row.name !== "string" ||
      typeof row.is_sub_recipe !== "boolean"
    ) {
      return [];
    }
    return [
      {
        id: String(row.id),
        name: row.name,
        isSubRecipe: row.is_sub_recipe,
      },
    ];
  });
}

function normalizeIngredients(value: unknown): CoffeeIngredient[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row): CoffeeIngredient[] => {
    if (
      !isRecord(row) ||
      (typeof row.id !== "string" && typeof row.id !== "number") ||
      typeof row.name !== "string" ||
      (row.unit !== "gr" && row.unit !== "ml")
    ) {
      return [];
    }
    return [{ id: String(row.id), name: row.name, unit: row.unit }];
  });
}

function normalizeRecipes(value: unknown): CoffeeRecipe[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((row): CoffeeRecipe[] => {
    if (
      !isRecord(row) ||
      (typeof row.id !== "string" && typeof row.id !== "number") ||
      (typeof row.menu_id !== "string" && typeof row.menu_id !== "number") ||
      (typeof row.ingredient_id !== "string" &&
        typeof row.ingredient_id !== "number")
    ) {
      return [];
    }
    const amount = Number(row.amount);
    if (!Number.isFinite(amount) || amount <= 0) return [];
    return [
      {
        id: String(row.id),
        menuId: String(row.menu_id),
        ingredientId: String(row.ingredient_id),
        amount,
      },
    ];
  });
}

function formatScaledAmount(scaledAmount: number): string {
  return (scaledAmount / 10_000).toLocaleString("id-ID", {
    maximumFractionDigits: 4,
  });
}

function aggregateIngredients(
  menus: CoffeeMenu[],
  ingredients: CoffeeIngredient[],
  recipes: CoffeeRecipe[],
  quantities: Record<string, number>,
): IngredientUsage[] {
  const menuById = new Map(menus.map((menu) => [menu.id, menu]));
  const ingredientById = new Map(
    ingredients.map((ingredient) => [ingredient.id, ingredient]),
  );
  const usageByIngredient = new Map<string, IngredientUsage>();

  for (const recipe of recipes) {
    const quantity = quantities[recipe.menuId] ?? 0;
    if (quantity <= 0) continue;

    const menu = menuById.get(recipe.menuId);
    const ingredient = ingredientById.get(recipe.ingredientId);
    if (!menu || !ingredient) continue;

    const amountScaled = Math.round(recipe.amount * 10_000) * quantity;
    const usage = usageByIngredient.get(ingredient.id) ?? {
      ingredient,
      totalScaled: 0,
      sources: [],
    };
    usage.totalScaled += amountScaled;
    usage.sources.push({ menuName: menu.name, amountScaled });
    usageByIngredient.set(ingredient.id, usage);
  }

  return [...usageByIngredient.values()].sort((a, b) =>
    a.ingredient.name.localeCompare(b.ingredient.name, "id"),
  );
}

/* ---------- Komponen kecil ---------- */

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C4F]/40";

function QuantityStepper({
  name,
  quantity,
  disabled,
  onChange,
}: {
  name: string;
  quantity: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1.5">
      <button
        aria-label={`Kurangi ${name}`}
        className={`grid size-11 place-items-center rounded-xl border border-[#C9D1CA] bg-white text-xl font-semibold text-[#1A2420] transition active:scale-95 disabled:opacity-30 ${focusRing}`}
        disabled={disabled || quantity === 0}
        onClick={() => onChange(quantity - 1)}
        type="button"
      >
        −
      </button>
      <input
        aria-label={`Jumlah ${name}`}
        className="h-11 w-14 rounded-xl border border-[#C9D1CA] bg-white text-center text-base font-bold tabular-nums text-[#1A2420] outline-none [appearance:textfield] focus:border-[#1F5C4F] focus:ring-2 focus:ring-[#1F5C4F]/20 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        inputMode="numeric"
        min={0}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        onFocus={(event) => event.currentTarget.select()}
        placeholder="0"
        type="number"
        value={quantity || ""}
      />
      <button
        aria-label={`Tambah ${name}`}
        className={`grid size-11 place-items-center rounded-xl bg-[#1F5C4F] text-xl font-semibold text-white transition active:scale-95 disabled:opacity-30 ${focusRing}`}
        disabled={disabled}
        onClick={() => onChange(quantity + 1)}
        type="button"
      >
        +
      </button>
    </div>
  );
}

/* ---------- Halaman utama ---------- */

export default function CoffeeAggregate() {
  const [menus, setMenus] = useState<CoffeeMenu[]>([]);
  const [ingredients, setIngredients] = useState<CoffeeIngredient[]>([]);
  const [recipes, setRecipes] = useState<CoffeeRecipe[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCoffeeData() {
      setIsLoading(true);
      setLoadError("");
      const [menuResponse, ingredientResponse, recipeResponse] =
        await Promise.all([
          supabase
            .from("coffee_menus")
            .select("id, name, is_sub_recipe")
            .order("name"),
          supabase
            .from("coffee_ingredients")
            .select("id, name, unit")
            .order("name"),
          supabase
            .from("coffee_menu_recipes")
            .select("id, menu_id, ingredient_id, amount"),
        ]);
      if (!active) return;

      const errors = [
        menuResponse.error && `menu: ${menuResponse.error.message}`,
        ingredientResponse.error &&
          `bahan baku: ${ingredientResponse.error.message}`,
        recipeResponse.error && `racikan: ${recipeResponse.error.message}`,
      ].filter((message): message is string => Boolean(message));

      if (errors.length > 0) {
        setLoadError(
          `Gagal memuat data dari database. ${errors.join("; ")}`,
        );
        setIsLoading(false);
        return;
      }

      const loadedMenus = normalizeMenus(menuResponse.data);
      const loadedIngredients = normalizeIngredients(ingredientResponse.data);
      const loadedRecipes = normalizeRecipes(recipeResponse.data);
      if (
        loadedMenus.length === 0 ||
        loadedIngredients.length === 0 ||
        loadedRecipes.length === 0
      ) {
        setLoadError("Data menu atau resep masih kosong.");
        setIsLoading(false);
        return;
      }

      setMenus(loadedMenus);
      setIngredients(loadedIngredients);
      setRecipes(loadedRecipes);
      setIsLoading(false);
    }

    void loadCoffeeData().catch((error: unknown) => {
      if (!active) return;
      const message =
        error instanceof Error ? error.message : "Kesalahan tidak diketahui.";
      setLoadError(`Koneksi database gagal: ${message}`);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  const query = search.trim();
  const isSearching = query.length > 0;

  // Menu hanya dihitung setelah ada kata pencarian.
  const filteredMenus = useMemo(() => {
    if (!query) return [];
    const lowered = query.toLocaleLowerCase("id");
    return menus.filter((menu) =>
      menu.name.toLocaleLowerCase("id").includes(lowered),
    );
  }, [menus, query]);

  const selectedMenus = useMemo(
    () => menus.filter((menu) => (quantities[menu.id] ?? 0) > 0),
    [menus, quantities],
  );

  const ingredientUsage = useMemo(
    () => aggregateIngredients(menus, ingredients, recipes, quantities),
    [menus, ingredients, recipes, quantities],
  );
  const soldMenuCount = selectedMenus.length;
  const totalServings = Object.values(quantities).reduce(
    (total, quantity) => total + quantity,
    0,
  );

  function changeQuantity(menuId: string, value: number) {
    const quantity = Number.isFinite(value)
      ? Math.max(0, Math.floor(value))
      : 0;
    setQuantities((current) => ({ ...current, [menuId]: quantity }));
    setActionMessage("");
  }

  function resetInputs() {
    setQuantities({});
    setSearch("");
    setActionMessage("Jumlah penjualan berhasil direset.");
  }

  function buildSummary(): string {
    const lines = [
      "☕ REKAP KEBUTUHAN BAHAN BAKU",
      `Total menu terjual: ${totalServings} porsi`,
      "",
      ...ingredientUsage.flatMap((usage, index) => [
        `${index + 1}. ${usage.ingredient.name}: ${formatScaledAmount(usage.totalScaled)} ${usage.ingredient.unit}`,
        `   Dari: ${usage.sources
          .map(
            (source) =>
              `${source.menuName} ${formatScaledAmount(source.amountScaled)} ${usage.ingredient.unit}`,
          )
          .join(", ")}`,
      ]),
    ];
    return lines.join("\n");
  }

  async function copySummary() {
    if (ingredientUsage.length === 0) return;
    try {
      await navigator.clipboard.writeText(buildSummary());
      setActionMessage("Rekap berhasil disalin.");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Izin clipboard ditolak.";
      setActionMessage(`Gagal menyalin: ${message}`);
    }
  }

  return (
    <main className="min-h-screen bg-[#F6F7F4] px-3 pb-16 text-[#1A2420] sm:px-6 print:bg-white print:p-0">
      <div className="mx-auto max-w-3xl">
        {/* Header ringkas */}
        <header className="flex items-center justify-between gap-3 py-3 print:hidden">
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold tracking-tight sm:text-xl">
              Rekap Bahan Baku
            </h1>
            <p className="truncate text-xs text-[#64706A]">
              Meksiko Coffee Break Point
            </p>
          </div>
          <Link
            className={`inline-flex h-10 shrink-0 items-center rounded-xl border border-[#C9D1CA] bg-white px-3 text-sm font-semibold text-[#1A2420] transition active:scale-95 ${focusRing}`}
            href="/"
          >
            ← POS
          </Link>
          
        </header>

        {loadError && (
          <div
            className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-800 print:hidden"
            role="alert"
          >
            {loadError}
          </div>
        )}

        {/* PENCARIAN (menempel di atas saat di-scroll) */}
        <div className="sticky top-0 z-20 -mx-3 bg-[#F6F7F4] px-3 pb-3 pt-1 sm:-mx-6 sm:px-6 print:hidden">
          <div className="relative">
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-[#64706A]"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              aria-label="Cari menu"
              autoComplete="off"
              className="h-12 w-full rounded-2xl border border-[#C9D1CA] bg-white pl-11 pr-12 text-base text-[#1A2420] shadow-sm outline-none transition placeholder:text-[#8A948E] focus:border-[#1F5C4F] focus:ring-2 focus:ring-[#1F5C4F]/20 [&::-webkit-search-cancel-button]:appearance-none"
              enterKeyHint="search"
              onChange={(event) => setSearch(event.currentTarget.value)}
              placeholder="Cari menu, mis. latte"
              type="search"
              value={search}
            />
            {search && (
              <button
                aria-label="Hapus pencarian"
                className={`absolute right-1.5 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-xl text-[#64706A] transition active:scale-95 ${focusRing}`}
                onClick={() => setSearch("")}
                type="button"
              >
                ×
              </button>
            )}
          </div>

          {/* Hasil pencarian: hanya muncul setelah mengetik */}
          {isSearching && (
            <div className="mt-2 overflow-hidden rounded-2xl border border-[#DDE2DB] bg-white shadow-lg">
              <div className="flex items-center justify-between gap-2 border-b border-[#EEF1EC] px-3 py-2">
                <p className="text-sm text-[#64706A]">
                  {isLoading
                    ? "Memuat menu..."
                    : `${filteredMenus.length} menu ditemukan`}
                </p>
                <button
                  className={`h-9 rounded-lg px-3 text-sm font-semibold text-[#1F5C4F] transition active:scale-95 ${focusRing}`}
                  onClick={() => setSearch("")}
                  type="button"
                >
                  Selesai
                </button>
              </div>

              {!isLoading && filteredMenus.length === 0 ? (
                <p className="px-4 py-6 text-center text-sm text-[#64706A]">
                  Tidak ada menu bernama “{query}”. Coba kata lain.
                </p>
              ) : (
                <ul className="max-h-[50vh] divide-y divide-[#EEF1EC] overflow-y-auto overscroll-contain">
                  {filteredMenus.map((menu) => {
                    const quantity = quantities[menu.id] ?? 0;
                    return (
                      <li
                        className={`flex items-center justify-between gap-3 px-3 py-2.5 ${
                          quantity > 0 ? "bg-[#EEF5F2]" : ""
                        }`}
                        key={menu.id}
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-semibold leading-snug">
                            {menu.name}
                          </p>
                          {menu.isSubRecipe && (
                            <span className="mt-1 inline-block rounded-md bg-[#FBEFD0] px-1.5 py-0.5 text-[11px] font-semibold text-[#7A5200]">
                              Racikan dasar
                            </span>
                          )}
                        </div>
                        <QuantityStepper
                          disabled={isLoading}
                          name={menu.name}
                          onChange={(value) => changeQuantity(menu.id, value)}
                          quantity={quantity}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
        </div>

        {/* Menu yang sudah dipilih (ketuk untuk ubah jumlah) */}
        {!isSearching && selectedMenus.length > 0 && (
          <section
            aria-label="Menu yang sudah dipilih"
            className="mb-3 print:hidden"
          >
            <div className="mb-1.5 flex items-center justify-between">
              <p className="text-sm font-semibold">
                Menu terjual
                <span className="ml-1.5 font-normal text-[#64706A]">
                  ketuk untuk ubah jumlah
                </span>
              </p>
              <button
                className={`h-9 rounded-lg px-3 text-sm font-semibold text-[#B3261E] transition active:scale-95 ${focusRing}`}
                onClick={resetInputs}
                type="button"
              >
                Reset
              </button>
            </div>
            <ul className="flex flex-wrap gap-2">
              {selectedMenus.map((menu) => (
                <li
                  className="flex h-10 items-center rounded-full border border-[#BFD6CE] bg-[#E6F0EC]"
                  key={menu.id}
                >
                  <button
                    className={`h-10 rounded-l-full pl-3.5 pr-2 text-sm font-semibold text-[#143D34] ${focusRing}`}
                    onClick={() => setSearch(menu.name)}
                    type="button"
                  >
                    {menu.name}
                    <span className="ml-1.5 tabular-nums">
                      ×{quantities[menu.id]}
                    </span>
                  </button>
                  <button
                    aria-label={`Hapus ${menu.name}`}
                    className={`grid size-10 place-items-center rounded-r-full text-lg text-[#143D34] ${focusRing}`}
                    onClick={() => changeQuantity(menu.id, 0)}
                    type="button"
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* TABEL KEBUTUHAN BAHAN */}
        <section
          aria-labelledby="aggregate-heading"
          className="rounded-2xl border border-[#DDE2DB] bg-white shadow-sm print:border-0 print:shadow-none"
        >
          <div className="flex items-end justify-between gap-3 p-3.5 sm:p-5">
            <div className="min-w-0">
              <h2
                className="text-base font-bold tracking-tight sm:text-lg"
                id="aggregate-heading"
              >
                Kebutuhan bahan
              </h2>
              <p className="text-sm text-[#64706A]">
                {totalServings > 0
                  ? `${soldMenuCount} menu, ${totalServings} porsi`
                  : "Belum ada menu dipilih"}
              </p>
            </div>
            <div className="flex shrink-0 gap-2 print:hidden">
              
              <button
                className={`h-10 rounded-xl bg-[#1F5C4F] px-3.5 text-sm font-semibold text-white transition active:scale-95 disabled:opacity-40 ${focusRing}`}
                disabled={ingredientUsage.length === 0}
                onClick={copySummary}
                type="button"
              >
                Salin
              </button>
            </div>
          </div>

          {actionMessage && (
            <p
              aria-live="polite"
              className="mx-3.5 mb-3 rounded-xl bg-[#E6F0EC] px-3 py-2 text-sm font-medium text-[#143D34] sm:mx-5 print:hidden"
              role="status"
            >
              {actionMessage}
            </p>
          )}

          {ingredientUsage.length === 0 ? (
            <div className="border-t border-[#EEF1EC] px-4 py-12 text-center">
              <p className="text-sm font-semibold">
                Cari menu di kolom atas
              </p>
              <p className="mx-auto mt-1 max-w-xs text-sm text-[#64706A]">
                Isi jumlah yang terjual, lalu kebutuhan bahan akan muncul di
                sini.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto border-t border-[#EEF1EC]">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Total kebutuhan bahan baku dari menu terjual
                </caption>
                <thead>
                  <tr className="bg-[#EEF1EC] text-xs font-semibold text-[#4F5A54]">
                    <th className="px-3.5 py-2.5 sm:px-5" scope="col">
                      Bahan baku
                    </th>
                    <th
                      className="hidden px-3 py-2.5 sm:table-cell"
                      scope="col"
                    >
                      Sumber menu
                    </th>
                    <th
                      className="px-3.5 py-2.5 text-right sm:px-5"
                      scope="col"
                    >
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {ingredientUsage.map((usage) => {
                    const sources = usage.sources
                      .map(
                        (source) =>
                          `${source.menuName} ${formatScaledAmount(source.amountScaled)} ${usage.ingredient.unit}`,
                      )
                      .join(", ");
                    return (
                      <tr
                        className="border-t border-[#EEF1EC] align-top"
                        key={usage.ingredient.id}
                      >
                        <th
                          className="px-3.5 py-3 text-sm font-semibold sm:px-5"
                          scope="row"
                        >
                          {usage.ingredient.name}
                          <span className="mt-0.5 block text-xs font-normal leading-relaxed text-[#64706A] sm:hidden print:hidden">
                            {sources}
                          </span>
                        </th>
                        <td className="hidden max-w-[260px] px-3 py-3 text-xs leading-relaxed text-[#64706A] sm:table-cell print:table-cell">
                          {sources}
                        </td>
                        <td className="whitespace-nowrap px-3.5 py-3 text-right sm:px-5">
                          <span className="text-lg font-bold tabular-nums">
                            {formatScaledAmount(usage.totalScaled)}
                          </span>{" "}
                          <span className="text-sm font-semibold text-[#64706A]">
                            {usage.ingredient.unit}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}