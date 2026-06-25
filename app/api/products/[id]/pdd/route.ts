import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthRole } from "@/lib/auth";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

// Register stealth plugin
try {
  puppeteer.use(StealthPlugin());
} catch (e) {
  // Silent fail if already registered
}

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
    const searchUrl = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(query)}`;

    console.log(`[PDD Scraper] Starting search for product: "${query}"`);

    // Load cookie from .env
    const pddCookie = process.env.PDD_COOKIE || "";
    if (!pddCookie) {
      return NextResponse.json(
        { 
          error: "Куки Pinduoduo не настроены. Для работы поиска необходимо войти на сайт mobile.yangkeduo.com в браузере, скопировать cookie и добавить переменную PDD_COOKIE в файл .env." 
        },
        { status: 400 }
      );
    }

    // Launch puppeteer
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-blink-features=AutomationControlled",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
      );
      await page.setViewport({ width: 375, height: 667, isMobile: true });

      // Inject cookies
      const cookies = pddCookie.split(";").map((c) => {
        const [name, ...valueParts] = c.trim().split("=");
        return {
          name,
          value: valueParts.join("="),
          domain: ".yangkeduo.com",
          path: "/",
        };
      }).filter(c => c.name && c.value);

      if (cookies.length > 0) {
        await page.setCookie(...cookies);
        console.log(`[PDD Scraper] Injected ${cookies.length} cookies.`);
      }

      // Go to page
      console.log(`[PDD Scraper] Navigating to search URL...`);
      await page.goto(searchUrl, { waitUntil: "networkidle2", timeout: 30000 });

      // Check if redirected to login page anyway (cookie expired)
      const finalUrl = page.url();
      if (finalUrl.includes("login.html") || finalUrl.includes("safe.yangkeduo.com")) {
        console.log(`[PDD Scraper] Redirected to login page. Cookie might be expired.`);
        return NextResponse.json(
          { 
            error: "Сессия Pinduoduo истекла или заблокирована. Пожалуйста, откройте mobile.yangkeduo.com в браузере, войдите заново и обновите куки PDD_COOKIE в файле .env." 
          },
          { status: 401 }
        );
      }

      // Evaluate rawData
      const rawData: any = await page.evaluate(() => {
        return (window as any).rawData || (window as any).state || null;
      });

      if (!rawData) {
        console.log(`[PDD Scraper] rawData is not found on page context.`);
        return NextResponse.json(
          { error: "Не удалось получить структурированные данные с Pinduoduo. Попробуйте обновить страницу." },
          { status: 502 }
        );
      }

      // Resolve listings from different possible schema locations
      let itemsList = [];
      if (rawData.stores && rawData.stores.store && rawData.stores.store.data) {
        const d = rawData.stores.store.data;
        if (d.ssrListData) {
          if (Array.isArray(d.ssrListData)) {
            itemsList = d.ssrListData;
          } else if (typeof d.ssrListData === "object") {
            itemsList = d.ssrListData.list || d.ssrListData.goods_list || d.ssrListData.goodsList || d.ssrListData.items || [];
          }
        }
      }

      if (!itemsList || itemsList.length === 0) {
        itemsList = 
          rawData.items || 
          rawData.goods_list || 
          rawData.goodsList || 
          (rawData.store && rawData.store.goodsList) || 
          [];
      }

      console.log(`[PDD Scraper] Found ${itemsList.length} items in rawData.`);

      const parsedItems = itemsList.map((item: any) => {
        const goodsId = item.goodsID || item.goods_id || item.goodsId || "";
        const title = item.goodsName || item.goods_name || item.title || item.goods_title || "";
        const priceVal = item.price || item.price_info || item.group_price || item.price_amount || 0;
        
        // Pinduoduo prices are in cents (fen)
        const priceYuan = typeof priceVal === "number" ? priceVal / 100 : parseFloat(String(priceVal)) / 100;
        const photo = item.imgUrl || item.hd_thumb_url || item.thumb_url || item.image_url || null;
        
        // Construct absolute URL
        let url = "";
        if (goodsId) {
          url = `https://mobile.yangkeduo.com/goods.html?goods_id=${goodsId}`;
        } else {
          const l = item.linkURL || item.link_url || item.link || "";
          url = l.startsWith("http") ? l : `https://mobile.yangkeduo.com/${l}`;
        }

        return {
          id: goodsId,
          title,
          price: priceYuan,
          priceLabel: `${priceYuan.toFixed(1)} ¥`,
          url,
          photo,
          salesLabel: item.salesTip || item.sales_tip || null,
        };
      }).filter((item: any) => item.title && !isNaN(item.price) && item.price > 0);

      // Compute statistics (in CNY)
      let stats = { min: 0, max: 0, avg: 0, count: 0 };
      if (parsedItems.length > 0) {
        const prices = parsedItems.map((item: any) => item.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const avg = Math.round(prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length);
        stats = { min, max, avg, count: parsedItems.length };
      }

      return NextResponse.json({
        success: true,
        query,
        searchUrl,
        stats,
        ads: parsedItems.slice(0, 15),
      });

    } finally {
      await browser.close();
      console.log(`[PDD Scraper] Browser closed.`);
    }

  } catch (error: any) {
    console.error("PDD research API error:", error);
    return NextResponse.json(
      { error: error.message || "Внутренняя ошибка сервера при парсинге Pinduoduo" },
      { status: 500 }
    );
  }
}
