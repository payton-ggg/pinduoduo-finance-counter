const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const path = require('path');
puppeteer.use(StealthPlugin());

async function run() {
  const query = "美式字母印花长袖纯棉T恤女秋季2024新款韩版宽松百搭灰色上衣";
  const url = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(query)}`;
  
  // Read PDD_COOKIE and BROWSERLESS_API_KEY from .env
  let pddCookie = '';
  let browserlessKey = '';
  try {
    const dotenvContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
    const pddCookieMatch = dotenvContent.match(/PDD_COOKIE="?([^"\n]+)"?/);
    pddCookie = pddCookieMatch ? pddCookieMatch[1] : '';
    
    const browserlessMatch = dotenvContent.match(/BROWSERLESS_API_KEY="?([^"\n]+)"?/);
    browserlessKey = browserlessMatch ? browserlessMatch[1] : '';
    
    console.log("Loaded configs from .env. Cookie length:", pddCookie.length, "Browserless Key length:", browserlessKey.length);
  } catch (err) {
    console.error("Failed to read .env file:", err.message);
  }

  console.log("Launching/Connecting browser...");
  let browser;
  if (browserlessKey) {
    console.log("Connecting to remote Browserless instance with stealth and proxy parameters...");
    browser = await puppeteer.connect({
      browserWSEndpoint: `wss://chrome.browserless.io/stealth?token=${browserlessKey}&stealth=true&blockAds=true&proxy=residential&proxyCountry=cn&--disable-blink-features=AutomationControlled`
    });
  } else {
    console.log("Launching local browser...");
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-blink-features=AutomationControlled'
      ]
    });
  }

  try {
    const page = await browser.newPage();
    console.log("Setting viewport and user agent...");
    await page.setUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36');
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
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
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
      if (rawData.stores && rawData.stores.store && rawData.stores.store.data) {
        const storeData = rawData.stores.store.data;
        console.log("stores.store.data keys:", Object.keys(storeData));
        if (storeData.ssrListData) {
          const ssrList = storeData.ssrListData;
          console.log("ssrListData type/keys:", Array.isArray(ssrList) ? `Array(length: ${ssrList.length})` : Object.keys(ssrList));
          
          if (Array.isArray(ssrList)) {
            console.log("ssrListData elements preview:", ssrList.slice(0, 2));
          } else if (ssrList && typeof ssrList === 'object') {
            // Check subfields like list, items, etc.
            for (const key of Object.keys(ssrList)) {
              const val = ssrList[key];
              console.log(`- ssrListData.${key}:`, Array.isArray(val) ? `Array(length: ${val.length})` : typeof val === 'object' ? `Object(keys: ${Object.keys(val).slice(0,5)})` : val);
            }
            // Is there a goods_list or list inside ssrList?
            const innerList = ssrList.list || ssrList.goods_list || ssrList.goodsList || ssrList.items || [];
            if (Array.isArray(innerList) && innerList.length > 0) {
              console.log("Found inner list elements preview:", innerList.slice(0, 2));
            }
          }
        }
      }

      // Let's resolve the items list from stores.store.data.ssrListData
      let itemsList = [];
      if (rawData.stores && rawData.stores.store && rawData.stores.store.data) {
        const d = rawData.stores.store.data;
        if (d.ssrListData) {
          if (Array.isArray(d.ssrListData)) {
            itemsList = d.ssrListData;
          } else if (typeof d.ssrListData === 'object') {
            itemsList = d.ssrListData.list || d.ssrListData.goods_list || d.ssrListData.goodsList || d.ssrListData.items || [];
          }
        }
      }
      
      if (itemsList.length === 0) {
        itemsList = 
          (rawData.stores && rawData.stores.store && rawData.stores.store.goodsList) ||
          rawData.items || 
          rawData.goods_list || 
          rawData.goodsList || 
          [];
      }
      
      console.log(`Found ${itemsList.length} items.`);
      itemsList.slice(0, 5).forEach((item, idx) => {
        console.log(`\nItem #${idx + 1}:`);
        console.log(`- Title: ${item.goods_name || item.goodsName || item.title || item.goods_title}`);
        const priceVal = item.price || item.price_info || item.group_price || item.price_amount;
        const parsedPrice = typeof priceVal === 'number' ? (priceVal / 100).toFixed(2) : priceVal;
        console.log(`- Price: ${parsedPrice} CNY`);
        console.log(`- Link: ${item.link_url || item.link || item.url || item.goods_link}`);
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
