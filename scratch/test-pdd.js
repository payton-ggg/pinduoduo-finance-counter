const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
puppeteer.use(StealthPlugin());

async function run() {
  const query = "iphone 13";
  const url = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(query)}`;
  
  // Read PDD_COOKIE from .env
  let pddCookie = '';
  try {
    const dotenvContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const pddCookieMatch = dotenvContent.match(/PDD_COOKIE="?([^"\n]+)"?/);
    pddCookie = pddCookieMatch ? pddCookieMatch[1] : '';
    console.log("Loaded cookie from .env. Cookie length:", pddCookie.length);
  } catch (err) {
    console.error("Failed to read .env file:", err.message);
  }

  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox', 
      '--disable-setuid-sandbox',
      '--disable-blink-features=AutomationControlled'
    ]
  });

  try {
    const page = await browser.newPage();
    console.log("Setting viewport and user agent...");
    await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1');
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    
    // Inject cookies
    if (pddCookie) {
      const cookies = pddCookie.split(';').map(c => {
        const [name, ...valueParts] = c.trim().split('=');
        return {
          name,
          value: valueParts.join('='),
          domain: '.yangkeduo.com',
          path: '/'
        };
      }).filter(c => c.name && c.value);
      
      if (cookies.length > 0) {
        await page.setCookie(...cookies);
        console.log(`Injected ${cookies.length} cookies.`);
      }
    }
    
    console.log("Navigating to search page:", url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("Final URL:", page.url());
    
    const html = await page.content();
    console.log("Is redirect to login/verification:", page.url().includes("login") || page.url().includes("safe.yangkeduo.com"));
    
    // Screenshot to verify
    const screenshotPath = path.join(__dirname, 'pdd-test-result.png');
    await page.screenshot({ path: screenshotPath });
    console.log("Saved verification screenshot to:", screenshotPath);
    
    const rawData = await page.evaluate(() => {
      return window.rawData || window.state || null;
    });
    
    if (rawData) {
      console.log("Success! Found rawData!");
      console.log("Top-level keys of rawData:", Object.keys(rawData));
      if (rawData.stores) {
        console.log("stores keys:", Object.keys(rawData.stores));
        if (rawData.stores.store) {
          console.log("stores.store keys:", Object.keys(rawData.stores.store));
          // Let's print nested properties of stores.store to see if there is goods/items/results list
          for (const key of Object.keys(rawData.stores.store)) {
            const val = rawData.stores.store[key];
            if (val && typeof val === 'object') {
              console.log(`- stores.store.${key} is object/array. Keys:`, Array.isArray(val) ? `Array(length: ${val.length})` : Object.keys(val).slice(0, 8));
            } else {
              console.log(`- stores.store.${key}:`, val);
            }
          }
        }
      }

      // Let's dynamically resolve the items list from various possible locations in rawData.stores
      const itemsList = 
        (rawData.stores && rawData.stores.store && rawData.stores.store.goodsList) ||
        (rawData.stores && rawData.stores.store && rawData.stores.store.goods_list) ||
        rawData.items || 
        rawData.goods_list || 
        rawData.goodsList || 
        (rawData.store && rawData.store.goodsList) || 
        [];
      console.log(`Found ${itemsList.length} items.`);
      itemsList.slice(0, 5).forEach((item, idx) => {
        console.log(`\nItem #${idx + 1}:`);
        console.log(`- Title: ${item.goods_name || item.goodsName || item.title}`);
        const priceVal = item.price || item.price_info || item.group_price;
        const parsedPrice = typeof priceVal === 'number' ? (priceVal / 100).toFixed(2) : priceVal;
        console.log(`- Price: ${parsedPrice} CNY`);
        console.log(`- Link: ${item.link_url || item.link || item.url}`);
      });
    } else {
      console.log("No rawData found on window context.");
    }
  } catch (err) {
    console.error("Navigation failed:", err);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

run();
