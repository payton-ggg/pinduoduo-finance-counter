import { headers } from "next/headers";
import ProductEditForm from "@/components/product/ProductEditForm";

export default async function ProductId({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const baseUrl = `${proto}://${host}`;
  const { id } = await params;
  const res = await fetch(`${baseUrl}/api/products/${id}`, {
    cache: "no-store",
  });
  if (!res.ok) {
    return (
      <div className="p-4">Не удалось загрузить продукт: {res.statusText}</div>
    );
  }
  const product = await res.json();

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-xl font-semibold mb-4">Редактирование продукта</h1>
      <ProductEditForm id={id} initialData={product} />
    </div>
  );
}
