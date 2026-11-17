import type { Metadata } from "next";
import CoffeeMaster from "./coffee-master";

export const metadata: Metadata = {
  title: "Data Master Kopi | Meksiko Coffee",
  description: "Kelola bahan baku, menu, dan resep Meksiko Coffee.",
};

export default function CoffeeMasterPage() {
  return <CoffeeMaster />;
}
