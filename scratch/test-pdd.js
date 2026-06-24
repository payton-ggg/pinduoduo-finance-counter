const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const homeUrl = `https://mobile.yangkeduo.com/`;
  const searchUrl = `https://mobile.yangkeduo.com/search_result.html?search_key=iphone%2013`;
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
    
    console.log("Navigating to home page first...");
    await page.goto(homeUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("Current URL:", page.url());
    
    console.log("Waiting 2 seconds...");
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Navigating to search page...");
    await page.goto(searchUrl, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("Final URL:", page.url());
    
    const html = await page.content();
    console.log("Is redirect to login/verification:", page.url().includes("login") || page.url().includes("safe.yangkeduo.com"));
    
    const rawData = await page.evaluate(() => {
      return window.rawData || window.state || null;
    });
    console.log("Is rawData available:", !!rawData);
  } catch (err) {
    console.error("Navigation failed:", err);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

run();
