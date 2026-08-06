import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const IO_API_KEY = process.env.IO_NET || "";
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
    const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || "";
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";

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

    // 1. Google Gemini API (100% Free Tier via Google AI Studio)
    if (!parsedData && GEMINI_API_KEY) {
      try {
        let base64Data = "";
        let mimeType = "image/jpeg";

        if (imageUrl) {
          const imgRes = await fetch(imageUrl);
          const arrayBuf = await imgRes.arrayBuffer();
          base64Data = Buffer.from(arrayBuf).toString("base64");
          mimeType = imgRes.headers.get("content-type") || "image/jpeg";
        } else if (base64Image) {
          const match = base64Image.match(/^data:(image\/\w+);base64,(.+)$/);
          if (match) {
            mimeType = match[1];
            base64Data = match[2];
          } else {
            base64Data = base64Image;
          }
        }

        const geminiTargets = [
          { ver: "v1beta", model: "gemini-2.0-flash-lite" },
          { ver: "v1beta", model: "gemini-2.0-flash-lite-preview-02-05" },
          { ver: "v1beta", model: "gemini-1.5-flash-8b" },
          { ver: "v1beta", model: "gemini-2.0-flash-exp" },
          { ver: "v1beta", model: "gemini-2.0-flash" },
          { ver: "v1", model: "gemini-2.0-flash" },
        ];

        let quotaErrorOccurred = false;

        for (const target of geminiTargets) {
          if (parsedData) break;
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/${target.ver}/models/${target.model}:generateContent?key=${GEMINI_API_KEY}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contents: [
                  {
                    parts: [
                      { text: systemPrompt },
                      {
                        inline_data: {
                          mime_type: mimeType,
                          data: base64Data,
                        },
                      },
                    ],
                  },
                ],
                generationConfig: {
                  responseMimeType: "application/json",
                },
              }),
            },
          );

          if (geminiRes.ok) {
            const resData = await geminiRes.json();
            let text =
              resData.candidates?.[0]?.content?.parts?.[0]?.text || "";
            text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
            if (text) {
              parsedData = JSON.parse(text);
              break;
            }
          } else {
            const errText = await geminiRes.text();
            console.warn(
              `Gemini API (${target.ver}/${target.model}) error:`,
              geminiRes.status,
              errText,
            );
            if (geminiRes.status === 429) {
              quotaErrorOccurred = true;
            }
          }
        }

        if (!parsedData && quotaErrorOccurred) {
          parsedData = {
            name: "",
            priceCNY: 0,
            pddSearchQuery: "",
            sellsCount: 0,
            warning:
              "Google AI Studio временно ограничивает лимит запросов (429 Rate Limit). Подождите 1 минуту и повторите попытку.",
          };
        }
      } catch (err) {
        console.error("Gemini Vision AI error:", err);
      }
    }

    // 2. OpenAI / OpenRouter / IO.net API
    if (!parsedData) {
      let apiUrl = "";
      let apiKey = "";
      let modelName = "";

      if (IO_API_KEY) {
        apiUrl = "https://api.intelligence.io.solutions/api/v1/chat/completions";
        apiKey = IO_API_KEY;
        modelName = "qwen/qwen-2.5-vl-72b-instruct";
      } else if (OPENAI_API_KEY) {
        apiUrl = "https://api.openai.com/v1/chat/completions";
        apiKey = OPENAI_API_KEY;
        modelName = "gpt-4o-mini";
      } else if (OPENROUTER_API_KEY) {
        apiUrl = "https://openrouter.ai/api/v1/chat/completions";
        apiKey = OPENROUTER_API_KEY;
        modelName = "google/gemini-2.5-flash:free";
      }

      if (apiKey) {
        try {
          const headers = {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          };

          const completionRes = await fetch(apiUrl, {
            method: "POST",
            headers,
            body: JSON.stringify({
              model: modelName,
              messages: [
                { role: "system", content: systemPrompt },
                {
                  role: "user",
                  content: [
                    {
                      type: "text",
                      text: "Analyze this Pinduoduo screenshot and extract product details as JSON.",
                    },
                    {
                      type: "image_url",
                      image_url: { url: imageSource },
                    },
                  ],
                },
              ],
              stream: false,
            }),
          });

          if (completionRes.ok) {
            const completionData = await completionRes.json();
            let content =
              completionData.choices?.[0]?.message?.content || "";
            content = content.replace(/```json/gi, "").replace(/```/g, "").trim();
            parsedData = JSON.parse(content);
          }
        } catch (err) {
          console.error("Error calling Vision API:", err);
        }
      }
    }

    if (!parsedData) {
      parsedData = {
        name: "",
        priceCNY: 0,
        pddSearchQuery: "",
        sellsCount: 0,
        warning:
          "Изображение загружено в галерею. Для автоматического распознавания данных укажите GEMINI_API_KEY (бесплатно в Google AI Studio).",
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
