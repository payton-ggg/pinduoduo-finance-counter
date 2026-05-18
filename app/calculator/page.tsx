import { getExchangeRates } from "@/lib/rates";
import { CalculatorClient } from "@/components/calculator/CalculatorClient";
import { AuthGate } from "@/components/auth/AuthGate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function CalculatorPage() {
  const rates = await getExchangeRates();

  return (
    <AuthGate>
      <div className="container mx-auto py-4">
        <CalculatorClient rates={rates} />
      </div>
    </AuthGate>
  );
}
