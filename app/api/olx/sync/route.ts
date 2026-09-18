import { NextResponse } from "next/server";
import { syncAccount, syncAllAccounts } from "@/lib/olx/sync";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { accountId } = body;

    if (accountId) {
      const res = await syncAccount(accountId);
      return NextResponse.json(res);
    } else {
      const res = await syncAllAccounts();
      return NextResponse.json({ success: true, results: res });
    }
  } catch (error: any) {
    console.error("POST /api/olx/sync error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
