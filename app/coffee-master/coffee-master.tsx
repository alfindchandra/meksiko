"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";

type CoffeeIngredient = {
  id: string;
  name: string;
  unit: "gr" | "ml";
};

type CoffeeMenu = {
  id: string;
  name: string;
  isSubRecipe: boolean;
};

type CoffeeRecipe = {
  id: string;
  menuId: string;
  ingredientId: string;
  amount: number;
};

type RecipeDraft = {
  ingredientId: string;
  amount: string;
};

type Tab = "menus" | "ingredients";
type SheetKind = "menu" | "ingredient" | null;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
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

/* ---------- Gaya bersama ---------- */

// text-base (16px) mencegah iPhone memperbesar layar saat mengetik.
const fieldClass =
  "h-12 w-full rounded-xl border border-[#C9D1CA] bg-white px-3 text-base text-[#1A2420] outline-none transition placeholder:text-[#8A948E] focus:border-[#1F5C4F] focus:ring-2 focus:ring-[#1F5C4F]/20";
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#1F5C4F]/40";
const outlineButton = `inline-flex h-10 items-center justify-center rounded-xl border border-[#C9D1CA] bg-white px-4 text-sm font-semibold text-[#1A2420] transition active:scale-95 ${focusRing}`;
const dangerButton = `inline-flex h-10 items-center justify-center rounded-xl border border-[#F0C4C0] bg-white px-4 text-sm font-semibold text-[#B3261E] transition active:scale-95 ${focusRing}`;

/* ---------- Komponen kecil ---------- */

function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="relative min-w-0 flex-1">
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
        aria-label={label}
        autoComplete="off"
        className="h-12 w-full rounded-2xl border border-[#C9D1CA] bg-white pl-11 pr-11 text-base text-[#1A2420] shadow-sm outline-none transition placeholder:text-[#8A948E] focus:border-[#1F5C4F] focus:ring-2 focus:ring-[#1F5C4F]/20 [&::-webkit-search-cancel-button]:appearance-none"
        enterKeyHint="search"
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
      {value && (
        <button
          aria-label="Hapus pencarian"
          className={`absolute right-1 top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-xl text-xl text-[#64706A] ${focusRing}`}
          onClick={() => onChange("")}
          type="button"
        >
          ×
        </button>
      )}
    </div>
  );
}

function Sheet({
  title,
  error,
  submitLabel,
  submitDisabled,
  onClose,
  onSubmit,
  children,
}: {
  title: string;
  error: string;
  submitLabel: string;
  submitDisabled: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  children: ReactNode;
}) {
  return (
    <div
      aria-label={title}
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
      role="dialog"
    >
      <button
        aria-label="Tutup formulir"
        className="absolute inset-0 bg-[#1A2420]/50"
        onClick={onClose}
        tabIndex={-1}
        type="button"
      />
      <form
        className="relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-3xl bg-white shadow-xl supports-[height:100dvh]:max-h-[90dvh] sm:max-w-lg sm:rounded-3xl"
        onSubmit={onSubmit}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#EEF1EC] px-4 py-2.5 sm:px-5">
          <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          <button
            aria-label="Tutup formulir"
            className={`grid size-11 place-items-center rounded-xl text-2xl text-[#64706A] ${focusRing}`}
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          {error && (
            <div
              className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-800"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="grid gap-4">{children}</div>
        </div>

        <div className="flex gap-2 border-t border-[#EEF1EC] bg-white px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-5">
          <button
            className={`h-12 rounded-xl border border-[#C9D1CA] bg-white px-5 text-sm font-semibold ${focusRing}`}
            onClick={onClose}
            type="button"
          >
            Batal
          </button>
          <button
            className={`h-12 flex-1 rounded-xl bg-[#1F5C4F] px-4 text-base font-semibold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 ${focusRing}`}
            disabled={submitDisabled}
            type="submit"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
}

/* ---------- Halaman utama ---------- */

export default function CoffeeMaster() {
  const [ingredients, setIngredients] = useState<CoffeeIngredient[]>([]);
  const [menus, setMenus] = useState<CoffeeMenu[]>([]);
  const [recipes, setRecipes] = useState<CoffeeRecipe[]>([]);
  const [tab, setTab] = useState<Tab>("menus");
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const [ingredientId, setIngredientId] = useState<string | null>(null);
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState<"gr" | "ml">("gr");

  const [menuId, setMenuId] = useState<string | null>(null);
  const [menuName, setMenuName] = useState("");
  const [menuIsSubRecipe, setMenuIsSubRecipe] = useState(false);
  const [recipeDrafts, setRecipeDrafts] = useState<RecipeDraft[]>([
    { ingredientId: "", amount: "" },
  ]);

  const loadData = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    setError("");
    try {
      const [ingredientResponse, menuResponse, recipeResponse] =
        await Promise.all([
          supabase
            .from("coffee_ingredients")
            .select("id, name, unit")
            .order("name"),
          supabase
            .from("coffee_menus")
            .select("id, name, is_sub_recipe")
            .order("name"),
          supabase
            .from("coffee_menu_recipes")
            .select("id, menu_id, ingredient_id, amount"),
        ]);
      const failures = [
        ingredientResponse.error &&
          `bahan baku: ${ingredientResponse.error.message}`,
        menuResponse.error && `menu: ${menuResponse.error.message}`,
        recipeResponse.error && `resep: ${recipeResponse.error.message}`,
      ].filter((message): message is string => Boolean(message));

      if (failures.length > 0) {
        setError(
          `Data master kopi gagal dimuat. Pastikan migrasi database kopi sudah dijalankan. ${failures.join("; ")}`,
        );
        setIsLoading(false);
        return false;
      }

      setIngredients(normalizeIngredients(ingredientResponse.data));
      setMenus(normalizeMenus(menuResponse.data));
      setRecipes(normalizeRecipes(recipeResponse.data));
      setIsLoading(false);
      return true;
    } catch (loadFailure) {
      const message =
        loadFailure instanceof Error
          ? loadFailure.message
          : "Kesalahan tidak diketahui.";
      setError(`Koneksi database kopi gagal: ${message}`);
      setIsLoading(false);
      return false;
    }
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadData]);

  // Pesan sukses hilang sendiri.
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  // Saat formulir terbuka: kunci scroll halaman dan izinkan tombol Esc.
  useEffect(() => {
    if (!sheet) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setSheet(null);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [sheet]);

  /* ----- Bahan baku ----- */

  function clearIngredientForm() {
    setIngredientId(null);
    setIngredientName("");
    setIngredientUnit("gr");
  }

  function resetIngredientForm() {
    clearIngredientForm();
    setSheet(null);
  }

  function openNewIngredient() {
    clearIngredientForm();
    setError("");
    setNotice("");
    setSheet("ingredient");
  }

  function editIngredient(ingredient: CoffeeIngredient) {
    setTab("ingredients");
    setIngredientId(ingredient.id);
    setIngredientName(ingredient.name);
    setIngredientUnit(ingredient.unit);
    setError("");
    setNotice("");
    setSheet("ingredient");
  }

  async function saveIngredient(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = ingredientName.trim();
    if (!name) {
      setError("Nama bahan baku wajib diisi.");
      return;
    }
    const unitChangedForUsedIngredient =
      ingredientId !== null &&
      ingredients.some(
        (ingredient) =>
          ingredient.id === ingredientId && ingredient.unit !== ingredientUnit,
      ) &&
      recipes.some((recipe) => recipe.ingredientId === ingredientId);
    if (unitChangedForUsedIngredient) {
      setError(
        "Satuan tidak bisa diubah selama bahan digunakan dalam resep. Hapus bahan tersebut dari resep terlebih dahulu.",
      );
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const query = ingredientId
        ? supabase
            .from("coffee_ingredients")
            .update({ name, unit: ingredientUnit })
            .eq("id", ingredientId)
        : supabase.from("coffee_ingredients").insert({
            name,
            unit: ingredientUnit,
          });
      const { error: saveError } = await query;
      if (saveError) throw saveError;
      const refreshed = await loadData();
      if (!refreshed) {
        setNotice("Data tersimpan, tetapi daftar gagal dimuat ulang.");
        return;
      }
      resetIngredientForm();
      setNotice(
        ingredientId
          ? "Bahan baku berhasil diperbarui."
          : "Bahan baku berhasil ditambahkan.",
      );
    } catch (saveFailure) {
      const message =
        saveFailure instanceof Error
          ? saveFailure.message
          : "Kesalahan tidak diketahui.";
      setError(`Bahan baku gagal disimpan: ${message}`);
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteIngredient(ingredient: CoffeeIngredient) {
    if (
      !window.confirm(
        `Hapus bahan baku "${ingredient.name}"? Bahan yang digunakan resep tidak dapat dihapus.`,
      )
    ) {
      return;
    }
    setError("");
    setNotice("");
    try {
      const { error: deleteError } = await supabase
        .from("coffee_ingredients")
        .delete()
        .eq("id", ingredient.id);
      if (deleteError) throw deleteError;
      const refreshed = await loadData();
      if (!refreshed) {
        setNotice("Bahan terhapus, tetapi daftar gagal dimuat ulang.");
        return;
      }
      if (ingredientId === ingredient.id) resetIngredientForm();
      setNotice("Bahan baku berhasil dihapus.");
    } catch (deleteFailure) {
      const message =
        deleteFailure instanceof Error
          ? deleteFailure.message
          : "Kesalahan tidak diketahui.";
      setError(
        `Bahan baku gagal dihapus. Periksa apakah bahan masih digunakan resep. ${message}`,
      );
    }
  }

  /* ----- Menu & resep ----- */

  function clearMenuForm() {
    setMenuId(null);
    setMenuName("");
    setMenuIsSubRecipe(false);
    setRecipeDrafts([{ ingredientId: "", amount: "" }]);
  }

  function resetMenuForm() {
    clearMenuForm();
    setSheet(null);
  }

  function openNewMenu() {
    clearMenuForm();
    setError("");
    setNotice("");
    setSheet("menu");
  }

  function editMenu(menu: CoffeeMenu) {
    const menuRecipes = recipes.filter((recipe) => recipe.menuId === menu.id);
    setTab("menus");
    setMenuId(menu.id);
    setMenuName(menu.name);
    setMenuIsSubRecipe(menu.isSubRecipe);
    setRecipeDrafts(
      menuRecipes.length > 0
        ? menuRecipes.map((recipe) => ({
            ingredientId: recipe.ingredientId,
            amount: String(recipe.amount),
          }))
        : [{ ingredientId: "", amount: "" }],
    );
    setError("");
    setNotice("");
    setSheet("menu");
  }

  function updateRecipeDraft(index: number, patch: Partial<RecipeDraft>) {
    setRecipeDrafts((current) =>
      current.map((draft, draftIndex) =>
        draftIndex === index ? { ...draft, ...patch } : draft,
      ),
    );
  }

  async function saveMenu(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = menuName.trim();
    if (!name) {
      setError("Nama menu wajib diisi.");
      return;
    }

    const validDrafts = recipeDrafts.map((draft) => ({
      ingredientId: draft.ingredientId,
      amount: Number(draft.amount),
    }));
    if (
      validDrafts.length === 0 ||
      validDrafts.some(
        (recipe) =>
          !recipe.ingredientId ||
          !Number.isFinite(recipe.amount) ||
          recipe.amount <= 0,
      )
    ) {
      setError("Pilih bahan dan isi takaran lebih dari 0 untuk setiap resep.");
      return;
    }
    if (
      new Set(validDrafts.map((recipe) => recipe.ingredientId)).size !==
      validDrafts.length
    ) {
      setError("Bahan yang sama hanya boleh ditambahkan satu kali per menu.");
      return;
    }

    setIsSaving(true);
    setError("");
    setNotice("");
    try {
      const { error: saveError } = await supabase.rpc("save_coffee_menu", {
        p_menu_id: menuId ? Number(menuId) : null,
        p_name: name,
        p_is_sub_recipe: menuIsSubRecipe,
        p_recipes: validDrafts.map((recipe) => ({
          ingredient_id: Number(recipe.ingredientId),
          amount: recipe.amount,
        })),
      });
      if (saveError) throw saveError;
      const refreshed = await loadData();
      if (!refreshed) {
        setNotice("Menu tersimpan, tetapi daftar gagal dimuat ulang.");
        return;
      }
      resetMenuForm();
      setNotice(
        menuId
          ? "Menu dan resep berhasil diperbarui."
          : "Menu berhasil ditambahkan.",
      );
    } catch (saveFailure) {
      const message =
        saveFailure instanceof Error
          ? saveFailure.message
          : "Kesalahan tidak diketahui.";
      setError(
        `Menu gagal disimpan. Pastikan migrasi data master kopi sudah dijalankan. ${message}`,
      );
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteMenu(menu: CoffeeMenu) {
    if (!window.confirm(`Hapus menu "${menu.name}" beserta semua resepnya?`)) {
      return;
    }
    setError("");
    setNotice("");
    try {
      const { error: deleteError } = await supabase
        .from("coffee_menus")
        .delete()
        .eq("id", menu.id);
      if (deleteError) throw deleteError;
      const refreshed = await loadData();
      if (!refreshed) {
        setNotice("Menu terhapus, tetapi daftar gagal dimuat ulang.");
        return;
      }
      if (menuId === menu.id) resetMenuForm();
      setNotice("Menu dan resepnya berhasil dihapus.");
    } catch (deleteFailure) {
      const message =
        deleteFailure instanceof Error
          ? deleteFailure.message
          : "Kesalahan tidak diketahui.";
      setError(`Menu gagal dihapus: ${message}`);
    }
  }

  /* ----- Data turunan ----- */

  const normalizedSearch = search.trim().toLocaleLowerCase("id");
  const filteredMenus = menus.filter((menu) =>
    menu.name.toLocaleLowerCase("id").includes(normalizedSearch),
  );
  const filteredIngredients = ingredients.filter((ingredient) =>
    ingredient.name.toLocaleLowerCase("id").includes(normalizedSearch),
  );

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "menus", label: "Menu & resep", count: menus.length },
    { key: "ingredients", label: "Bahan baku", count: ingredients.length },
  ];

  const emptyMessage = (kind: "menu" | "bahan", total: number) =>
    total === 0
      ? `Belum ada ${kind}. Ketuk “Tambah” untuk membuat ${kind} pertama.`
      : `Tidak ada ${kind} bernama “${search.trim()}”. Coba kata lain.`;

  return (
    <main className="min-h-screen bg-[#F6F7F4] px-3 pb-24 text-[#1A2420] sm:px-6">
      <div className="mx-auto max-w-3xl">
        {/* Header ringkas */}
        <header className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
          <div className="min-w-0">
            <h1 className="text-lg font-bold tracking-tight sm:text-xl">
              Data Master Kopi
            </h1>
            <p className="text-xs text-[#64706A]">Meksiko Coffee Break Point</p>
          </div>
          <nav className="flex gap-2">
            <Link className={outlineButton} href="/coffee-aggregate">
              Rekap bahan
            </Link>
            <Link className={outlineButton} href="/">
              ← POS
            </Link>
          </nav>
        </header>

        {error && !sheet && (
          <div
            className="mb-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm leading-5 text-red-800"
            role="alert"
          >
            {error}
          </div>
        )}

        {/* Tab */}
        <div
          aria-label="Jenis data"
          className="grid grid-cols-2 gap-1 rounded-2xl bg-[#E4E9E3] p-1"
          role="tablist"
        >
          {tabs.map((item) => {
            const active = tab === item.key;
            return (
              <button
                aria-selected={active}
                className={`h-11 rounded-xl text-sm font-semibold transition ${focusRing} ${
                  active
                    ? "bg-white text-[#143D34] shadow-sm"
                    : "text-[#4F5A54]"
                }`}
                key={item.key}
                onClick={() => {
                  setTab(item.key);
                  setSearch("");
                }}
                role="tab"
                type="button"
              >
                {item.label}
                <span className="ml-1.5 font-normal tabular-nums text-[#64706A]">
                  {item.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pencarian + tombol tambah (menempel di atas saat di-scroll) */}
        <div className="sticky top-0 z-20 -mx-3 flex gap-2 bg-[#F6F7F4] px-3 pb-3 pt-3 sm:-mx-6 sm:px-6">
          <SearchField
            label={tab === "menus" ? "Cari menu" : "Cari bahan"}
            onChange={setSearch}
            placeholder={
              tab === "menus" ? "Cari nama menu" : "Cari nama bahan"
            }
            value={search}
          />
          <button
            aria-label={tab === "menus" ? "Tambah menu" : "Tambah bahan baku"}
            className={`h-12 shrink-0 rounded-2xl bg-[#1F5C4F] px-4 text-sm font-semibold text-white shadow-sm transition active:scale-95 ${focusRing}`}
            onClick={tab === "menus" ? openNewMenu : openNewIngredient}
            type="button"
          >
            + Tambah
          </button>
        </div>

        {/* Daftar */}
        {isLoading ? (
          <p className="rounded-2xl border border-[#DDE2DB] bg-white p-6 text-center text-sm text-[#64706A]">
            Memuat data...
          </p>
        ) : tab === "menus" ? (
          filteredMenus.length === 0 ? (
            <p className="rounded-2xl border border-[#DDE2DB] bg-white p-6 text-center text-sm text-[#64706A]">
              {emptyMessage("menu", menus.length)}
            </p>
          ) : (
            <ul className="grid gap-2.5">
              {filteredMenus.map((menu) => {
                const menuRecipes = recipes.filter(
                  (recipe) => recipe.menuId === menu.id,
                );
                const recipeText = menuRecipes
                  .map((recipe) => {
                    const ingredient = ingredients.find(
                      (item) => item.id === recipe.ingredientId,
                    );
                    return ingredient
                      ? `${ingredient.name} ${recipe.amount.toLocaleString("id-ID")} ${ingredient.unit}`
                      : null;
                  })
                  .filter(Boolean)
                  .join(", ");
                return (
                  <li
                    className="rounded-2xl border border-[#DDE2DB] bg-white p-3.5 shadow-sm"
                    key={menu.id}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold leading-snug">
                        {menu.name}
                      </h3>
                      <span
                        className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                          menu.isSubRecipe
                            ? "bg-[#FBEFD0] text-[#7A5200]"
                            : "bg-[#E6F0EC] text-[#143D34]"
                        }`}
                      >
                        {menu.isSubRecipe ? "Racikan dasar" : "Menu jual"}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-[#64706A]">
                      {recipeText || "Belum ada detail resep"}
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        className={`${outlineButton} flex-1 sm:flex-none`}
                        onClick={() => editMenu(menu)}
                        type="button"
                      >
                        Ubah
                      </button>
                      <button
                        className={`${dangerButton} flex-1 sm:flex-none`}
                        onClick={() => void deleteMenu(menu)}
                        type="button"
                      >
                        Hapus
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )
        ) : filteredIngredients.length === 0 ? (
          <p className="rounded-2xl border border-[#DDE2DB] bg-white p-6 text-center text-sm text-[#64706A]">
            {emptyMessage("bahan", ingredients.length)}
          </p>
        ) : (
          <ul className="divide-y divide-[#EEF1EC] overflow-hidden rounded-2xl border border-[#DDE2DB] bg-white shadow-sm">
            {filteredIngredients.map((ingredient) => (
              <li
                className="flex items-center justify-between gap-3 px-3.5 py-3"
                key={ingredient.id}
              >
                <div className="min-w-0">
                  <p className="text-base font-semibold leading-snug">
                    {ingredient.name}
                  </p>
                  <p className="text-sm text-[#64706A]">
                    Satuan {ingredient.unit}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    aria-label={`Ubah ${ingredient.name}`}
                    className={outlineButton}
                    onClick={() => editIngredient(ingredient)}
                    type="button"
                  >
                    Ubah
                  </button>
                  <button
                    aria-label={`Hapus ${ingredient.name}`}
                    className={dangerButton}
                    onClick={() => void deleteIngredient(ingredient)}
                    type="button"
                  >
                    Hapus
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <p className="mt-6 text-center text-xs text-[#8A948E]">
          Data master ini memakai tabel kopi tersendiri, terpisah dari katalog
          produk dan data outlet POS.
        </p>
      </div>

      {/* Formulir menu */}
      {sheet === "menu" && (
        <Sheet
          error={error}
          onClose={resetMenuForm}
          onSubmit={saveMenu}
          submitDisabled={isLoading || isSaving || ingredients.length === 0}
          submitLabel={
            isSaving
              ? "Menyimpan..."
              : menuId
                ? "Simpan perubahan"
                : "Simpan menu"
          }
          title={menuId ? "Ubah menu" : "Tambah menu"}
        >
          <label className="grid gap-1.5 text-sm font-semibold">
            Nama menu
            <input
              className={fieldClass}
              maxLength={100}
              onChange={(event) => setMenuName(event.currentTarget.value)}
              placeholder="Contoh: Coffee Latte"
              required
              value={menuName}
            />
          </label>

          <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-[#DDE2DB] bg-[#F6F7F4] px-3 py-2">
            <input
              checked={menuIsSubRecipe}
              className="size-5 shrink-0 accent-[#1F5C4F]"
              onChange={(event) =>
                setMenuIsSubRecipe(event.currentTarget.checked)
              }
              type="checkbox"
            />
            <span>
              <span className="block text-sm font-semibold">
                Racikan dasar
              </span>
              <span className="block text-xs text-[#64706A]">
                Centang untuk racikan yang dipakai menu lain.
              </span>
            </span>
          </label>

          <div>
            <h3 className="text-sm font-semibold">Komposisi per porsi</h3>
            <p className="mb-2 mt-0.5 text-xs text-[#64706A]">
              Pilih bahan dan isi takaran untuk satu porsi.
            </p>

            <div className="grid gap-2.5">
              {recipeDrafts.map((draft, index) => {
                const chosenIngredient = ingredients.find(
                  (ingredient) => ingredient.id === draft.ingredientId,
                );
                return (
                  <div
                    className="grid gap-2 rounded-2xl border border-[#DDE2DB] bg-[#F6F7F4] p-2.5"
                    key={`recipe-${index}`}
                  >
                    <select
                      aria-label={`Bahan resep ${index + 1}`}
                      className={fieldClass}
                      onChange={(event) =>
                        updateRecipeDraft(index, {
                          ingredientId: event.currentTarget.value,
                        })
                      }
                      value={draft.ingredientId}
                    >
                      <option value="">Pilih bahan...</option>
                      {ingredients.map((ingredient) => (
                        <option key={ingredient.id} value={ingredient.id}>
                          {ingredient.name} ({ingredient.unit})
                        </option>
                      ))}
                    </select>
                    <div className="flex gap-2">
                      <div className="relative min-w-0 flex-1">
                        <input
                          aria-label={`Takaran resep ${index + 1}`}
                          className={`${fieldClass} pr-12`}
                          inputMode="decimal"
                          min="0.0001"
                          onChange={(event) =>
                            updateRecipeDraft(index, {
                              amount: event.currentTarget.value,
                            })
                          }
                          placeholder="Takaran"
                          required
                          step="any"
                          type="number"
                          value={draft.amount}
                        />
                        {chosenIngredient && (
                          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#64706A]">
                            {chosenIngredient.unit}
                          </span>
                        )}
                      </div>
                      <button
                        aria-label={`Hapus bahan resep ${index + 1}`}
                        className={`h-12 shrink-0 rounded-xl border border-[#F0C4C0] bg-white px-4 text-sm font-semibold text-[#B3261E] transition active:scale-95 disabled:opacity-40 ${focusRing}`}
                        disabled={recipeDrafts.length === 1}
                        onClick={() =>
                          setRecipeDrafts((current) =>
                            current.filter(
                              (_, draftIndex) => draftIndex !== index,
                            ),
                          )
                        }
                        type="button"
                      >
                        Hapus
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <button
              className={`mt-2.5 h-12 w-full rounded-xl border border-dashed border-[#1F5C4F]/50 text-sm font-semibold text-[#1F5C4F] transition active:scale-[0.98] disabled:opacity-50 ${focusRing}`}
              disabled={ingredients.length === 0}
              onClick={() =>
                setRecipeDrafts((current) => [
                  ...current,
                  { ingredientId: "", amount: "" },
                ])
              }
              type="button"
            >
              + Tambah bahan
            </button>

            {ingredients.length === 0 && (
              <p className="mt-2.5 rounded-xl bg-amber-50 p-3 text-sm leading-5 text-amber-800">
                Tambahkan bahan baku terlebih dahulu sebelum membuat resep
                menu.
              </p>
            )}
          </div>
        </Sheet>
      )}

      {/* Formulir bahan baku */}
      {sheet === "ingredient" && (
        <Sheet
          error={error}
          onClose={resetIngredientForm}
          onSubmit={saveIngredient}
          submitDisabled={isLoading || isSaving}
          submitLabel={
            isSaving
              ? "Menyimpan..."
              : ingredientId
                ? "Simpan perubahan"
                : "Simpan bahan baku"
          }
          title={ingredientId ? "Ubah bahan baku" : "Tambah bahan baku"}
        >
          <label className="grid gap-1.5 text-sm font-semibold">
            Nama bahan baku
            <input
              className={fieldClass}
              maxLength={100}
              onChange={(event) =>
                setIngredientName(event.currentTarget.value)
              }
              placeholder="Contoh: Espresso"
              required
              value={ingredientName}
            />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            Satuan
            <select
              className={fieldClass}
              onChange={(event) =>
                setIngredientUnit(event.currentTarget.value as "gr" | "ml")
              }
              value={ingredientUnit}
            >
              <option value="gr">gr (gram)</option>
              <option value="ml">ml (mililiter)</option>
            </select>
          </label>
          <p className="text-xs leading-5 text-[#64706A]">
            Bahan yang sudah dipakai dalam resep tidak dapat dihapus sampai
            bahan tersebut dilepas dari semua resep.
          </p>
        </Sheet>
      )}

      {/* Pesan sukses */}
      {notice && (
        <div
          className="pointer-events-none fixed inset-x-3 bottom-4 z-[60] flex justify-center sm:inset-x-6"
          role="status"
        >
          <p className="pointer-events-auto w-full max-w-md rounded-2xl bg-[#143D34] px-4 py-3 text-sm font-medium text-white shadow-lg">
            {notice}
          </p>
        </div>
      )}
    </main>
  );
}