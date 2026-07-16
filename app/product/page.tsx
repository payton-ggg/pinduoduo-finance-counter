import ProductForm from "@/components/product/ProductForm";
import { getExchangeRates } from "@/lib/rates";
import { getAuthRole } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import Loading from "@/app/loading";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function CreateProductWrapper({ folderId }: { folderId: string }) {
  const rates = await getExchangeRates();
  return (
    <div className="py-8">
      <ProductForm initialRates={rates} initialData={folderId ? { folderId } : undefined} />
    </div>
  );
}

export default async function CreateProduct({
  searchParams,
}: {
  searchParams: Promise<{ folderId?: string }> | { folderId?: string };
}) {
  const role = await getAuthRole();
  if (!role) {
    redirect("/");
  }

  const resolvedSearchParams = await searchParams;
  const folderId = resolvedSearchParams?.folderId || "";

  return (
    <Suspense fallback={<Loading />}>
      <CreateProductWrapper folderId={folderId} />
    </Suspense>
  );
}
