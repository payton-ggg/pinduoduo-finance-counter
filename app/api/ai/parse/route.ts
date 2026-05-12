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
- name (string)
- olxUrl (string)
- pinduoduoUrl (string)
- priceCNY (number)
- shippingUA (number)
- managementUAH (number)
- workModalWindowIOS (boolean)
- soundReducer (boolean)
- sensesOfEar (boolean)
- wirelessCharger (boolean)
- gyroscope (boolean)
- weight (number)
- microphoneQuality (string)
- sellsCount (number)
- purchasedCount (number)
- chip (string)
- equipment (string)
- priceInUA (number)

If a field is not mentioned, omit it or set it to null/false/0 appropriately. Return only the JSON object, no markdown code blocks, no other text.`;

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
    
    // Clean up potential markdown formatting in the response
    content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (e) {
      throw new Error("Failed to parse JSON from AI response: " + content);
    }

    // Return the successfully parsed data
    return NextResponse.json({ data: parsedData, verified: true });

  } catch (error: any) {
    console.error("AI parse error:", error);
    
    // Fallback mock data in case the API request fails
    return NextResponse.json({
      warning: "API fetch failed. Returning mock data for demonstration. Error: " + error.message,
      data: {
        name: "AirPods Pro 2",
        priceCNY: 150,
        chip: "Airoha 1562AE",
        gyroscope: true,
        soundReducer: true,
        sensesOfEar: true,
        weight: 250,
        microphoneQuality: "Excellent",
        priceInUA: 2000,
      },
    });
  }
}
