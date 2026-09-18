import { Suspense } from "react";
import { AuthGate } from "@/components/auth/AuthGate";
import { OlxHub } from "@/components/olx/OlxHub";
import { getExchangeRates } from "@/lib/rates";
import Loading from "@/app/loading";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OlxPage() {
  const rates = await getExchangeRates();
  const rate = rates.cny || 5.8;

  return (
    <AuthGate>
      <div className="container mx-auto h-screen max-h-screen flex flex-col overflow-hidden">
        <Suspense fallback={<Loading />}>
          <OlxHub globalRate={rate} />
        </Suspense>
      </div>
    </AuthGate>
  );
}
