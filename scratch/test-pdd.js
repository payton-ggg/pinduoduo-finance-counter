const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const query = "iphone 13";
  const url = `https://mobile.yangkeduo.com/search_result.html?search_key=${encodeURIComponent(query)}`;
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
    
    console.log("Navigating to:", url);
    const res = await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    
    console.log("Response status:", res.status());
    console.log("Final URL after navigation:", page.url());
    
    // Save screenshot
    const screenshotPath = 'C:/Users/plato/.gemini/antigravity-ide/brain/43f4d0d4-0e51-415c-a5cf-0d460ecf37de/pdd-screenshot.png';
    console.log("Saving screenshot to:", screenshotPath);
    await page.screenshot({ path: screenshotPath });

    const html = await page.content();
    console.log("Is verification/login wall:", html.includes("verify") || html.includes("login") || html.includes("safe.yangkeduo.com"));
    
    const rawData = await page.evaluate(() => {
      return window.rawData || window.state || null;
    });
    console.log("Is rawData available:", !!rawData);
  } catch (err) {
    console.error("Scraping failed:", err);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

run();
