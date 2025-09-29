import { headers } from "next/headers";
import ProductEditForm from "@/components/product/ProductEditForm";
import { DeleteProductButton } from "@/components/product/DeleteProductButton";

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
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-0">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl sm:text-3xl font-bold">
          Редактирование продукта
        </h1>
        <DeleteProductButton id={id} />
      </div>
      <ProductEditForm id={id} initialData={product} />
    </div>
  );
}
