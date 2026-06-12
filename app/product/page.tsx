import ProductForm from "@/components/product/ProductForm";
import { getExchangeRates } from "@/lib/rates";

export default async function CreateProduct({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }> | { folderId?: string };
}) {
  const resolvedSearchParams = await searchParams;
  const folderId = resolvedSearchParams?.folderId || "";
  const rates = await getExchangeRates();
  return (
    <div className="py-8">
      <ProductForm initialRates={rates} initialData={folderId ? { folderId } : undefined} />
    </div>
  );
}
