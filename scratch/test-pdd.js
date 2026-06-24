const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const url = `https://mobile.yangkeduo.com/`;
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
    
    console.log("Navigating to home page:", url);
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
    console.log("Final URL after home navigation:", page.url());
    
    const html = await page.content();
    console.log("Home page HTML length:", html.length);
    console.log("Home page is redirect to login/verification:", page.url().includes("login") || page.url().includes("safe.yangkeduo.com"));
  } catch (err) {
    console.error("Home navigation failed:", err);
  } finally {
    await browser.close();
    console.log("Browser closed.");
  }
}

run();
