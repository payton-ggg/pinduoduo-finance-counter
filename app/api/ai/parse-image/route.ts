import { NextResponse } from "next/server";

const IO_API_KEY = process.env.IO_NET || "";
const BASE_URL = "https://api.intelligence.io.solutions/api/v1";

export async function POST(req: Request) {
  try {
    const { imageUrl, base64Image } = await req.json();

    if (!imageUrl && !base64Image) {
      return NextResponse.json(
        { error: "Either imageUrl or base64Image is required" },
        { status: 400 },
      );
    }

    const imageSource =
      imageUrl ||
      (base64Image?.startsWith("data:")
        ? base64Image
        : `data:image/jpeg;base64,${base64Image}`);

    const systemPrompt = `You are an AI specialized in analyzing e-commerce screenshots from Chinese platforms like Pinduoduo (拼多多).
Extract the following information from the screenshot image:
- name: Product title/name (in Russian if possible, or clean readable title)
- priceCNY: Purchase price in Chinese Yuan (numeric value extracted from ¥ or ￥ price tag)
- pddSearchQuery: Short search query in Chinese for finding this product on Pinduoduo
- sellsCount: Number of units sold (if present, e.g. "已拼10万+件" -> 100000 or numeric value)

Return ONLY a valid JSON object with keys: name, priceCNY, pddSearchQuery, sellsCount.
No markdown formatting, no code blocks, only raw JSON.`;

    let parsedData: any = null;

    if (IO_API_KEY) {
      try {
        const headers = {
          Authorization: `Bearer ${IO_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        };

        const completionRes = await fetch(`${BASE_URL}/chat/completions`, {
          method: "POST",
          headers,
          body: JSON.stringify({
            model: "qwen/qwen-2.5-vl-72b-instruct",
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Analyze this Pinduoduo screenshot and extract product details as JSON.",
                  },
                  {
                    type: "image_url",
                    image_url: {
                      url: imageSource,
                    },
                  },
                ],
              },
            ],
            stream: false,
          }),
        });

        if (completionRes.ok) {
          const completionData = await completionRes.json();
          let content = completionData.choices?.[0]?.message?.content || "";
          content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
          parsedData = JSON.parse(content);
        } else {
          console.warn(
            "Vision model request status:",
            completionRes.status,
            await completionRes.text(),
          );
        }
      } catch (err) {
        console.error("Error calling Vision AI:", err);
      }
    }

    if (!parsedData) {
      parsedData = {
        name: "",
        priceCNY: 0,
        pddSearchQuery: "",
        sellsCount: 0,
        warning:
          "Изображение загружено. Оформите название и цену вручную (Vision AI ключ не настроен или временно недоступен).",
      };
    }

    return NextResponse.json({ data: parsedData, success: true });
  } catch (error: any) {
    console.error("AI image parse error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to process screenshot" },
      { status: 500 },
    );
  }
}
