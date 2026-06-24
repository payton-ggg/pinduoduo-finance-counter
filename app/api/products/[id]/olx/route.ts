import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const role = await getAuthRole();
  if (!role) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: { folder: true },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if (role === "restricted" && !product.folder.allowedForSecondPassword) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    const query = product.name;
    const url = `https://www.olx.ua/uk/list/q-${encodeURIComponent(query)}/`;

    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      next: { revalidate: 60 }, // Cache search results for 1 minute
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `OLX returned status ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const hasState = html.includes("__PRERENDERED_STATE__");

    if (!hasState) {
      return NextResponse.json(
        { error: "Could not fetch search data from OLX (Cloudflare protection or page layout change)" },
        { status: 502 }
      );
    }

    const match = html.match(/window\.__PRERENDERED_STATE__\s*=\s*"([\s\S]*?)"\s*;/);
    if (!match) {
      return NextResponse.json(
        { error: "Could not parse data from OLX structure" },
        { status: 502 }
      );
    }

    const escapedJsonStr = match[1];
    let data;
    try {
      const unescaped = JSON.parse('"' + escapedJsonStr + '"');
      data = JSON.parse(unescaped);
    } catch (e) {
      return NextResponse.json(
        { error: "Failed to parse data schema from OLX" },
        { status: 502 }
      );
    }

    const rawAds = data.listing?.listing?.ads || [];
    const ads = rawAds.map((ad: any) => {
      const priceVal = ad.price?.regularPrice?.value || ad.price?.value;
      const currency = ad.price?.regularPrice?.currencySymbol || ad.price?.regularPrice?.currencyCode || "грн.";
      const photo = Array.isArray(ad.photos) && ad.photos.length > 0 ? ad.photos[0] : null;
      const district = ad.location?.districtName ? `, ${ad.location.districtName}` : "";
      const location = `${ad.location?.cityName || ""}${district}`;

      return {
        id: ad.id,
        title: ad.title,
        price: typeof priceVal === "number" ? priceVal : parseFloat(String(priceVal).replace(/\s/g, "").replace(/[^0-9.]/g, "")),
        priceLabel: ad.price?.displayValue || (priceVal ? `${priceVal} ${currency}` : "Договорная"),
        url: ad.url,
        location,
        photo,
        itemCondition: ad.itemCondition || "Не указано",
      };
    }).filter((ad: any) => ad.title && !isNaN(ad.price) && ad.price > 0);

    // Calculate stats
    let stats = { min: 0, max: 0, avg: 0, count: 0 };
    if (ads.length > 0) {
      const prices = ads.map((ad: any) => ad.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const avg = Math.round(prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length);
      stats = { min, max, avg, count: ads.length };
    }

    return NextResponse.json({
      success: true,
      query,
      url,
      stats,
      ads: ads.slice(0, 15), // return top 15 ads for display
    });
  } catch (error: any) {
    console.error("OLX research route error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
