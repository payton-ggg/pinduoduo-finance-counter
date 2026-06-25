const fs = require('fs');
const path = require('path');

// Read SITE_PASSWORD and BROWSERLESS_API_KEY from .env
let sitePassword = '';
try {
  const dotenvContent = fs.readFileSync(path.join(__dirname, '../.env'), 'utf8');
  const passwordMatch = dotenvContent.match(/SITE_PASSWORD="?([^"\n]+)"?/);
  sitePassword = passwordMatch ? passwordMatch[1] : '';
  console.log("Loaded site password from .env. Length:", sitePassword.length);
} catch (err) {
  console.error("Failed to read .env file:", err.message);
}

async function run() {
  const url = 'http://localhost:3000/api/products/d30044af-5394-4c90-9bd3-59b76033b943/pdd';
  console.log(`Sending GET request to local API endpoint: ${url}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Cookie': `site_password=${sitePassword}`
      }
    });
    
    console.log("Response status:", response.status);
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Fetch request failed:", err);
  }
}

run();
