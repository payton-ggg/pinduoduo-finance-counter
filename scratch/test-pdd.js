const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const query = "iphone 13";
  const url = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(query)}`;
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    console.log("Setting viewport and user agent...");
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    
    console.log("Navigating to:", url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log("Evaluating page state...");
    const rawData = await page.evaluate(() => {
      return window.rawData || window.state || null;
    });

    if (rawData) {
      console.log("Found rawData!");
      // Let's log some details of the object keys
      console.log("Keys in rawData:", Object.keys(rawData));
      
      // Let's try to find goods list
      // In mobile PDD, search results are usually under rawData.store.items, rawData.goods_list, rawData.goodsList, or rawData.items
      let goodsList = null;
      
      // We will search recursively or print rawData structure
      if (rawData.items) goodsList = rawData.items;
      else if (rawData.goods_list) goodsList = rawData.goods_list;
      else if (rawData.goodsList) goodsList = rawData.goodsList;
      else if (rawData.store && rawData.store.goodsList) goodsList = rawData.store.goodsList;
      
      // Let's print rawData keys and nested details
      console.log("rawData preview (first 500 chars):", JSON.stringify(rawData).substring(0, 500));
      
      if (goodsList && Array.isArray(goodsList)) {
        console.log(`Found goods list of length: ${goodsList.length}`);
        goodsList.slice(0, 5).forEach((item, idx) => {
          console.log(`\nItem #${idx + 1}:`);
          console.log(`- Title: ${item.goods_name || item.goodsName || item.title}`);
          const priceVal = item.price || item.price_info || item.group_price;
          // PDD prices are in cents (fen), e.g. 5900 = 59 CNY
          const parsedPrice = typeof priceVal === 'number' ? (priceVal / 100).toFixed(2) : priceVal;
          console.log(`- Price: ${parsedPrice} CNY`);
          console.log(`- Image: ${item.hd_thumb_url || item.thumb_url || item.imgUrl}`);
          console.log(`- Link: ${item.link_url || item.link || item.url}`);
        });
      } else {
        console.log("Could not locate items list in rawData directly. Let's inspect store values if they exist.");
        if (rawData.store) {
          console.log("Store keys:", Object.keys(rawData.store));
        }
      }
    } else {
      console.log("No rawData or state object found on window context.");
      // Let's print page content length
      const html = await page.content();
      console.log("HTML length:", html.length);
      console.log("HTML preview:", html.substring(0, 1000));
    }
  } catch (err) {
    console.error("Scraping failed:", err);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

run();
