import ProductForm from "@/components/product/ProductForm";
import { getExchangeRates } from "@/lib/rates";

export default async function CreateProduct() {
  const rates = await getExchangeRates();
  return (
    <div className="py-8">
      <ProductForm initialRates={rates} />
    </div>
  );
}
