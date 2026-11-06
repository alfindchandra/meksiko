# Laris — Laporan Barang Laku

Aplikasi POS sederhana berbasis Next.js App Router, React, TypeScript, dan Tailwind CSS 4. Mendukung pilihan harga bertingkat, pencatatan transaksi harian, rekap penjualan, serta penyalinan laporan untuk WhatsApp.

## Menjalankan aplikasi

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000).

Periksa kualitas kode dan buat build produksi dengan:

```bash
npm run lint
npm run build
```

## Struktur

```text
app/
  lib/
    sales.ts          # Tipe, format harga, dan validasi transaksi
    catalog.ts        # 80 produk, harga tier, dan 38 outlet dari workbook
    master.ts         # Validasi dan penyimpanan data master lokal
  globals.css         # Gaya responsif, termasuk sidebar dan navigasi bawah
  layout.tsx          # Root layout dan metadata
  page.tsx            # Halaman utama
  pos-dashboard.tsx   # Kasir, keranjang, laporan, dan penyimpanan lokal
  master-data.tsx     # CRUD barang, tier harga, dan ruko
```

## Penggunaan

- Cari dan pilih outlet, lalu cari barang berdasarkan nama (minimal 2 karakter). Klik hasil nama barang untuk membuka modal pilihan satuan dan harga.
- Harga dan daftar outlet diambil dari workbook `Daftar_Harga_Meksiko_Store-v3.xlsx`. Modal menampilkan tier yang tersedia untuk produk tersebut: `1 BTL`, `1/2 CTN UMUM`, `1 CTN UMUM`, dan/atau `1 CTN CAFE`. Tier yang tidak memiliki harga di workbook tidak ditampilkan.
- Tambahkan item ke daftar barang laku, atur kuantitas, lalu masukkan nominal titipan fisik untuk melihat selisih setoran. **Atur nominal pas** mengisi total penjualan secara otomatis.
- Pilih **Salin** pada panel konfirmasi untuk menyalin ringkasan setoran outlet, barang, dan selisih.
- Pilih **Simpan penjualan** untuk mencatat transaksi dan outlet terpilih.
- Buka **Laporan penjualan** untuk melihat rekap per produk dan tier. Gunakan pemilih tanggal untuk melihat laporan tanggal lain.
- Pilih **Salin ke WhatsApp** untuk menyalin ringkasan dengan format teks dan emoji ke clipboard.
- Buka **Data master** untuk menambah, mengubah, dan menghapus barang/tier harga maupun ruko. Perubahan berlaku langsung di kasir dan tersimpan di browser pada perangkat ini.

Data awal produk dan outlet hasil impor tersimpan di `app/lib/catalog.ts`. Penyesuaian lewat menu Data master disimpan di `localStorage` browser dengan kunci `laris-master-data-v1`, sehingga setelah katalog diedit, data master tersimpan di perangkat ini dan tidak disinkronkan antarperangkat. Untuk kembali ke data awal workbook, hapus kunci tersebut dari `localStorage` browser. Jika workbook berubah, impor ulang data tersebut agar katalog mengikuti daftar harga terbaru.

## Retensi data

Transaksi disimpan di `localStorage` browser dengan kunci `laris-sales-v1`. Data kedaluwarsa setelah 3 × 24 jam sejak transaksi dibuat, dibersihkan saat aplikasi dibuka, dan dihapus otomatis saat aplikasi tetap terbuka melewati waktu kedaluwarsa. Data berada di perangkat/browser yang sama; mode privat, penghapusan data browser, atau perangkat lain tidak berbagi salinan.

Data lokal ini cocok untuk prototipe atau penggunaan satu perangkat, bukan sebagai penyimpanan POS multi-kasir. Untuk penggunaan produksi, pindahkan transaksi ke database dan terapkan kebijakan retensi di server.
