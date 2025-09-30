import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

const prisma = new PrismaClient();

export async function GET() {
  const result: any = {
    env: {
      hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
      hasCloudinaryCloudName: Boolean(process.env.CLOUDINARY_CLOUD_NAME),
      hasCloudinaryApiKey: Boolean(process.env.CLOUDINARY_API_KEY),
      hasCloudinaryApiSecret: Boolean(process.env.CLOUDINARY_API_SECRET),
    },
    db: { ok: false },
  };

  try {
    // Simple connectivity check
    const ping = await prisma.$queryRaw`SELECT 1`;
    result.db.ok = true;
    result.db.ping = Array.isArray(ping) ? ping : String(ping);
  } catch (e: any) {
    result.db.error = e?.message || String(e);
  }

  return NextResponse.json(result);
}