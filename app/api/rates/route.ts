import { NextResponse } from "next/server";
import { getExchangeRates } from "@/lib/rates";

export async function GET() {
  try {
    const rates = await getExchangeRates();
    return NextResponse.json(rates);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch rates" }, { status: 500 });
  }
}
