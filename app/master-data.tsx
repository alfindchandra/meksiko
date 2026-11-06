"use client";

import { FormEvent, useMemo, useState } from "react";
import { formatRupiah, PriceTier, Product } from "./lib/sales";
import { Outlet } from "./lib/catalog";

type MasterTab = "products" | "outlets";
type ProductDraft = Omit<Product, "id">;

const EMPTY_PRODUCT: ProductDraft = {
  name: "",
  category: "",
  unit: "BTL",
  emoji: "",
  tiers: [{ id: "bottle", label: "1 BTL", price: 0 }],
};

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("id-ID")
    .replace(/\s+/g, " ")
    .trim();
}

export default function MasterData({
  products,
  outlets,
  ready,
  productLoadError,
  outletLoadError,
  onSaveProducts,
  onSaveOutlets,
  onNotify,
}: {
  products: Product[];
  outlets: Outlet[];
  ready: boolean;
  productLoadError: string;
  outletLoadError: string;
  onSaveProducts: (products: Product[]) => Promise<boolean>;
  onSaveOutlets: (outlets: Outlet[]) => Promise<boolean>;
  onNotify: (message: string, error?: boolean) => void;
}) {
  const [tab, setTab] = useState<MasterTab>("products");
  const [search, setSearch] = useState("");
  const [productForm, setProductForm] = useState<Product | null>(null);
  const [outletForm, setOutletForm] = useState<Outlet | null>(null);
  const [saving, setSaving] = useState(false);
  const activeLoadError =
    tab === "products" ? productLoadError : outletLoadError;

  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(search);
    if (!query) return products;
    return products.filter((product) =>
      normalizeSearch(`${product.name} ${product.category}`).includes(query),
    );
  }, [products, search]);

  const filteredOutlets = useMemo(() => {
    const query = normalizeSearch(search);
    if (!query) return outlets;
    return outlets.filter((outlet) =>
      normalizeSearch(outlet.name).includes(query),
    );
  }, [outlets, search]);

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!productForm) return;
    const name = productForm.name.trim();
    const category = productForm.category.trim();
    const unit = productForm.unit.trim();
    const emoji = productForm.emoji.trim();
    const tiers = productForm.tiers.map((tier) => ({
      ...tier,
      label: tier.label.trim(),
    }));

    if (!name || !category || !unit) {
      onNotify("Nama, kategori, dan satuan barang harus diisi.", true);
      return;
    }
    if (
      tiers.length === 0 ||
      tiers.some(
        (tier) =>
          !tier.label ||
          !Number.isFinite(tier.price) ||
          tier.price < 0,
      )
    ) {
      onNotify("Tambahkan tier harga dengan nama dan harga yang valid.", true);
      return;
    }

    const duplicate = products.some(
      (product) =>
        product.id !== productForm.id &&
        product.name.toLocaleLowerCase("id-ID") === name.toLocaleLowerCase("id-ID"),
    );
    if (duplicate) {
      onNotify("Nama barang tersebut sudah terdaftar.", true);
      return;
    }

    const savedProduct: Product = {
      ...productForm,
      id: productForm.id,
      name,
      category,
      unit,
      emoji,
      tiers,
    };
    const next = productForm.id
      ? products.map((product) =>
          product.id === productForm.id ? savedProduct : product,
        )
      : [...products, savedProduct];

    setSaving(true);
    try {
      if (await onSaveProducts(next)) {
        setProductForm(null);
        onNotify("Data barang berhasil disimpan ke database.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function saveOutlet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!outletForm) return;
    const name = outletForm.name.trim();
    if (!name) {
      onNotify("Nama ruko wajib diisi.", true);
      return;
    }
    const duplicate = outlets.some(
      (outlet) =>
        outlet.id !== outletForm.id &&
        outlet.name.toLocaleLowerCase("id-ID") === name.toLocaleLowerCase("id-ID"),
    );
    if (duplicate) {
      onNotify("Nama ruko tersebut sudah terdaftar.", true);
      return;
    }

    const savedOutlet = {
      ...outletForm,
      id: outletForm.id,
      name,
    };
    const next = outletForm.id
      ? outlets.map((outlet) =>
          outlet.id === outletForm.id ? savedOutlet : outlet,
        )
      : [...outlets, savedOutlet];

    setSaving(true);
    try {
      if (await onSaveOutlets(next)) {
        setOutletForm(null);
        onNotify("Data ruko berhasil disimpan ke database.");
      }
    } finally {
      setSaving(false);
    }
  }

  function updateTier(tierId: string, patch: Partial<PriceTier>) {
    setProductForm((current) =>
      current
        ? {
            ...current,
            tiers: current.tiers.map((tier) =>
              tier.id === tierId ? { ...tier, ...patch } : tier,
            ),
          }
        : current,
    );
  }

  function addTier() {
    const tierId = `tier-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setProductForm((current) =>
      current
        ? {
            ...current,
            tiers: [
              ...current.tiers,
              { id: tierId, label: "", price: 0 },
            ],
          }
        : current,
    );
  }

  async function deleteProduct(product: Product) {
    if (
      !window.confirm(
        `Hapus barang "${product.name}" dari data master? Transaksi lama tetap tersimpan.`,
      )
    ) {
      return;
    }
    setSaving(true);
    try {
      if (await onSaveProducts(products.filter((item) => item.id !== product.id))) {
        onNotify("Barang berhasil dihapus dari database.");
      }
    } finally {
      setSaving(false);
    }
  }

  async function deleteOutlet(outlet: Outlet) {
    if (!window.confirm(`Hapus ruko "${outlet.name}" dari data master?`)) {
      return;
    }
    setSaving(true);
    try {
      if (await onSaveOutlets(outlets.filter((item) => item.id !== outlet.id))) {
        onNotify("Ruko berhasil dihapus dari database.");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <section className="master-page">
        <div className="master-intro">
          <div>
            <p className="eyebrow">Pengaturan toko</p>
            <h1 className="page-title">Data master</h1>
            <p className="page-description">
              Kelola barang, tier harga, dan daftar ruko untuk transaksi POS.
            </p>
          </div>
          <span className="master-storage-badge">
            {productLoadError || outletLoadError
              ? "Database sebagian tersedia"
              : ready
                ? "Terhubung ke database"
                : "Memuat database..."}
          </span>
        </div>

        <div className="master-toolbar panel">
          <div className="master-tabs" role="tablist" aria-label="Jenis data master">
            <button
              aria-selected={tab === "products"}
              className={`master-tab${tab === "products" ? " active" : ""}`}
              onClick={() => {
                setTab("products");
                setSearch("");
              }}
              role="tab"
              type="button"
            >
              Barang <span>{products.length}</span>
            </button>
            <button
              aria-selected={tab === "outlets"}
              className={`master-tab${tab === "outlets" ? " active" : ""}`}
              onClick={() => {
                setTab("outlets");
                setSearch("");
              }}
              role="tab"
              type="button"
            >
              Ruko <span>{outlets.length}</span>
            </button>
          </div>
          <label className="master-search">
            <span aria-hidden="true">⌕</span>
            <input
              aria-label={tab === "products" ? "Cari barang" : "Cari ruko"}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={
                tab === "products" ? "Cari nama barang..." : "Cari nama ruko..."
              }
              value={search}
            />
          </label>
          <button
            className="primary-button master-add-button"
            disabled={!ready || Boolean(activeLoadError) || saving}
            onClick={() =>
              tab === "products"
                ? setProductForm({
                    id: "",
                    ...EMPTY_PRODUCT,
                    tiers: EMPTY_PRODUCT.tiers.map((tier) => ({ ...tier })),
                  })
                : setOutletForm({ id: "", name: "" })
            }
            type="button"
          >
            <span aria-hidden="true">＋</span>
            {tab === "products" ? "Tambah barang" : "Tambah ruko"}
          </button>
        </div>

        {tab === "products" ? (
          <div className="master-product-grid">
            {filteredProducts.map((product) => (
              <article className="panel master-product-card" key={product.id}>
                <div className="master-product-top">
                  <div className="master-product-name">
                    <strong>{product.name}</strong>
                    <span>
                      {product.category} · {product.unit}
                    </span>
                  </div>
                </div>
                <div className="master-price-list">
                  {product.tiers.length ? (
                    product.tiers.map((tier) => (
                      <div className="master-price-row" key={tier.id}>
                        <span>{tier.label}</span>
                        <strong>{formatRupiah(tier.price)}</strong>
                      </div>
                    ))
                  ) : (
                    <p className="master-empty-price">Belum ada tier harga.</p>
                  )}
                </div>
                <div className="master-card-actions">
                  <button
                    className="secondary-button"
                    disabled={!ready || Boolean(activeLoadError) || saving}
                    onClick={() =>
                      setProductForm({
                        ...product,
                        tiers: product.tiers.map((tier) => ({ ...tier })),
                      })
                    }
                    type="button"
                  >
                    ✎ Edit barang
                  </button>
                  <button
                    aria-label={`Hapus ${product.name}`}
                    className="danger-button"
                    disabled={!ready || Boolean(activeLoadError) || saving}
                    onClick={() => deleteProduct(product)}
                    type="button"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
            {filteredProducts.length === 0 && (
              <div className="panel master-empty">
                {productLoadError
                  ? "Data barang belum dapat dimuat. Lihat pesan database di atas."
                  : products.length === 0
                    ? "Belum ada data barang di database."
                    : `Tidak ada barang yang cocok dengan “${search.trim()}”.`}
              </div>
            )}
          </div>
        ) : (
          <div className="master-outlet-grid">
            {filteredOutlets.map((outlet) => (
              <article className="panel master-outlet-card" key={outlet.id}>
                <span className="master-outlet-icon" aria-hidden="true">
                  ⌖
                </span>
                <strong>{outlet.name}</strong>
                <div className="master-card-actions">
                  <button
                    className="secondary-button"
                    disabled={!ready || Boolean(activeLoadError) || saving}
                    onClick={() =>
                      setOutletForm({ ...outlet, city: outlet.city ?? "" })
                    }
                    type="button"
                  >
                    ✎ Edit nama
                  </button>
                  <button
                    aria-label={`Hapus ruko ${outlet.name}`}
                    className="danger-button"
                    disabled={!ready || Boolean(activeLoadError) || saving}
                    onClick={() => deleteOutlet(outlet)}
                    type="button"
                  >
                    Hapus
                  </button>
                </div>
              </article>
            ))}
            {filteredOutlets.length === 0 && (
              <div className="panel master-empty">
                {outletLoadError
                  ? "Data ruko belum dapat dimuat. Lihat pesan database di atas."
                  : outlets.length === 0
                    ? "Belum ada data ruko di database."
                    : `Tidak ada ruko yang cocok dengan “${search.trim()}”.`}
              </div>
            )}
          </div>
        )}
      </section>

      {productForm && (
        <div
          className="master-modal-backdrop"
          onClick={() => setProductForm(null)}
        >
          <section
            aria-labelledby="product-form-title"
            aria-modal="true"
            className="master-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <form onSubmit={saveProduct}>
              <header className="master-modal-header">
                <div>
                  <h2 id="product-form-title">
                    {productForm.id ? "Edit barang" : "Tambah barang"}
                  </h2>
                  <p>Lengkapi identitas barang dan semua harga jualnya.</p>
                </div>
                <button
                  aria-label="Tutup form barang"
                  className="tier-modal-close"
                  onClick={() => setProductForm(null)}
                  type="button"
                >
                  ×
                </button>
              </header>
              <div className="master-form-body">
                <div className="master-form-grid">
                  <label className="master-field master-field-wide">
                    Nama barang
                    <input
                      autoFocus
                      onChange={(event) =>
                        setProductForm({ ...productForm, name: event.target.value })
                      }
                      placeholder="Contoh: Minuman 600 ml"
                      required
                      value={productForm.name}
                    />
                  </label>
                  <label className="master-field">
                    Kategori
                    <input
                      onChange={(event) =>
                        setProductForm({
                          ...productForm,
                          category: event.target.value,
                        })
                      }
                      placeholder="Contoh: BEER"
                      required
                      value={productForm.category}
                    />
                  </label>
                  <label className="master-field">
                    Satuan dasar
                    <input
                      onChange={(event) =>
                        setProductForm({ ...productForm, unit: event.target.value })
                      }
                      placeholder="BTL"
                      required
                      value={productForm.unit}
                    />
                  </label>
                </div>

                <div className="master-tier-heading">
                  <div>
                    <strong>Tier harga</strong>
                    <span>Harga yang diubah langsung dipakai oleh kasir.</span>
                  </div>
                  <button
                    className="secondary-button"
                    onClick={addTier}
                    type="button"
                  >
                    ＋ Tambah tier
                  </button>
                </div>
                <div className="master-tier-editor">
                  {productForm.tiers.map((tier) => (
                    <div className="master-tier-edit-row" key={tier.id}>
                      <label className="master-field">
                        Nama satuan / tier
                        <input
                          onChange={(event) =>
                            updateTier(tier.id, { label: event.target.value })
                          }
                          placeholder="1 BTL / 1 CTN UMUM"
                          required
                          value={tier.label}
                        />
                      </label>
                      <label className="master-field">
                        Harga (Rp)
                        <input
                          autoComplete="off"
                          inputMode="numeric"
                          onChange={(event) =>
                            updateTier(tier.id, {
                              price: Number(
                                event.target.value.replace(/\D/g, ""),
                              ),
                            })
                          }
                          required
                          type="text"
                          value={String(tier.price).replace(
                            /\B(?=(\d{3})+(?!\d))/g,
                            ".",
                          )}
                        />
                      </label>
                      <button
                        aria-label={`Hapus tier ${tier.label || "baru"}`}
                        className="tier-remove-button"
                        disabled={productForm.tiers.length <= 1 || saving}
                        onClick={() =>
                          setProductForm({
                            ...productForm,
                            tiers: productForm.tiers.filter(
                              (item) => item.id !== tier.id,
                            ),
                          })
                        }
                        type="button"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <footer className="master-modal-footer">
                <button
                  className="secondary-button"
                  onClick={() => setProductForm(null)}
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="primary-button"
                  disabled={!ready || Boolean(productLoadError) || saving}
                  type="submit"
                >
                  {saving ? "Menyimpan..." : "Simpan barang"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}

      {outletForm && (
        <div
          className="master-modal-backdrop"
          onClick={() => setOutletForm(null)}
        >
          <section
            aria-labelledby="outlet-form-title"
            aria-modal="true"
            className="master-modal outlet-form-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <form onSubmit={saveOutlet}>
              <header className="master-modal-header">
                <div>
                  <h2 id="outlet-form-title">
                    {outletForm.id ? "Edit nama ruko" : "Tambah ruko"}
                  </h2>
                  <p>Nama ruko ini digunakan saat mencatat setoran.</p>
                </div>
                <button
                  aria-label="Tutup form ruko"
                  className="tier-modal-close"
                  onClick={() => setOutletForm(null)}
                  type="button"
                >
                  ×
                </button>
              </header>
              <div className="master-form-body">
                <label className="master-field">
                  Nama ruko
                  <input
                    autoFocus
                    onChange={(event) =>
                      setOutletForm({ ...outletForm, name: event.target.value })
                    }
                    placeholder="Masukkan nama ruko"
                    required
                    value={outletForm.name}
                  />
                </label>
              </div>
              <footer className="master-modal-footer">
                <button
                  className="secondary-button"
                  onClick={() => setOutletForm(null)}
                  type="button"
                >
                  Batal
                </button>
                <button
                  className="primary-button"
                  disabled={!ready || Boolean(outletLoadError) || saving}
                  type="submit"
                >
                  {saving ? "Menyimpan..." : "Simpan ruko"}
                </button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </>
  );
}