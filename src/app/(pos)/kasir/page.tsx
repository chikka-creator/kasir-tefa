import React from "react";
import { PosMainScreen } from "@/components/pos/PosMainScreen";
import { getInventoryProducts } from "@/lib/inventory-data";

export const dynamic = "force-dynamic";

export default async function KasirPage() {
  const products = await getInventoryProducts();

  const formattedProducts = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    item_type: p.item_type,
    selling_price: p.selling_price,
    cost_price: p.cost_price,
    stock_qty: p.stock_qty,
    unit: p.unit,
    category_name: p.category_name || "Lainnya",
  }));

  return <PosMainScreen initialProducts={formattedProducts} />;
}
