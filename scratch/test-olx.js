// wait, in Next.js/Node 18+ we can use global fetch. Let's use global fetch.
async function test() {
  const query = "iphone 13";
  const url = `https://www.olx.ua/uk/list/q-${encodeURIComponent(query)}/`;
  console.log("Fetching URL:", url);
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "uk-UA,uk;q=0.9,en-US;q=0.8,en;q=0.7",
      }
    });
    console.log("Status:", res.status);
    console.log("Headers:", Object.fromEntries(res.headers.entries()));
    const html = await res.text();
    console.log("HTML length:", html.length);
    
    // Check if we got blocked or if we have the prerendered state
    const hasState = html.includes("__PRERENDERED_STATE__");
    console.log("Contains PRERENDERED_STATE:", hasState);
    if (hasState) {
      const match = html.match(/window\.__PRERENDERED_STATE__\s*=\s*"([\s\S]*?)"\s*;/);
      if (match) {
        let escapedJsonStr = match[1];
        // The JSON string inside window.__PRERENDERED_STATE__ is double-escaped. Let's unescape it.
        // It's a JS string containing escaped JSON: e.g. "{\"listing\":...}"
        // Since it's inside a string literal, we can unescape the JSON using a helper or JSON.parse on the quoted string.
        // Let's write a clean unescaping parser:
        let jsonStr = escapedJsonStr;
        
        // Wait, because we matched the raw HTML, characters like \" are literally backslash-quote, and unicode sequences might be \u0022.
        // Let's try parsing it as a JS string by wrapping it in quotes and using JSON.parse.
        // E.g. JSON.parse('"' + escapedJsonStr + '"')
        try {
          const unescaped = JSON.parse('"' + escapedJsonStr + '"');
          const data = JSON.parse(unescaped);
          
          const ads = data.listing?.listing?.ads || [];
          console.log(`Found ${ads.length} ads:`);
          if (ads.length > 0) {
            console.log("Full schema of first ad object:\n", JSON.stringify(ads[0], null, 2));
          }
        } catch (e) {
          console.error("Failed to parse JSON string:", e.message);
        }
      } else {
        console.log("Could not match window.__PRERENDERED_STATE__ regex");
      }
    } else {
      console.log("No __PRERENDERED_STATE__ found in HTML");
    }
  } catch (err) {
    console.error("Fetch error:", err);
  }
}
test();
