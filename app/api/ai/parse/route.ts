import { NextResponse } from "next/server";

const IO_API_KEY = process.env.IO_NET || "";
const BASE_URL = "https://api.intelligence.io.solutions/api/v1";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    if (!IO_API_KEY) {
      return NextResponse.json(
        { error: "IO_NET is not configured in .env" },
        { status: 500 },
      );
    }

    const headers = {
      Authorization: `Bearer ${IO_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const systemPrompt = `You are an AI assistant that extracts product information from user text and returns ONLY a valid JSON object.
Extract these fields:
- name (string) — product name
- priceCNY (number) — purchase price in Chinese Yuan
- priceInUA (number) — selling price in Ukrainian Hryvnia
- weight (number) — weight in grams
- pddSearchQuery (string) — search text for finding the product on Pinduoduo
- sellsCount (number) — number of units sold
- purchasedCount (number) — number of units purchased
- shippingUA (number) — shipping cost in UAH
- managementUAH (number) — management expenses in UAH

If a field is not mentioned, omit it or set it to null/0 appropriately. Return only the JSON object, no markdown code blocks, no other text.`;

    const completionRes = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model: "mistralai/Mistral-Large-Instruct-2411",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text },
        ],
        stream: false,
      }),
    });

    if (!completionRes.ok) {
      const errorText = await completionRes.text();
      throw new Error(`Failed to get completion: ${completionRes.status} ${completionRes.statusText} - ${errorText}`);
    }

    const completionData = await completionRes.json();
    let content = completionData.choices?.[0]?.message?.content || "";

    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      throw new Error("Failed to parse JSON from AI response: " + content);
    }

    return NextResponse.json({ data: parsedData, verified: true });

  } catch (error: any) {
    console.error("AI parse error:", error);

    return NextResponse.json({
      warning: "API fetch failed. Returning mock data for demonstration. Error: " + error.message,
      data: {
        name: "Sample Product",
        priceCNY: 150,
        weight: 250,
        priceInUA: 2000,
      },
    });
  }
}
