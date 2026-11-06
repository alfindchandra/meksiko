import type { Metadata } from "next";
import BranchReport from "./report";

export const metadata: Metadata = {
  title: "Laporan Cabang | Meksiko Group",
  description: "Laporan penjualan harian dan rekap keuangan cabang.",
};

export default function LaporanCabangPage() {
  return <BranchReport />;
}
