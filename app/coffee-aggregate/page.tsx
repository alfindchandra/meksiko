import type { Metadata } from "next";
import CoffeeAggregate from "./coffee-aggregate";

export const metadata: Metadata = {
  title: "Kalkulator Rekap Bahan Baku | Meksiko Coffee",
  description:
    "Hitung kebutuhan bahan baku kopi dari jumlah menu yang terjual.",
};

export default function CoffeeAggregatePage() {
  return <CoffeeAggregate />;
}
