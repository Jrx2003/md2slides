module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  const kimiApiKey = process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY;
  const accessCode = process.env.MD2SLIDES_ACCESS_CODE || process.env.AI_ACCESS_CODE;
  const providedCode = req.headers["x-access-code"] || req.headers["X-Access-Code"];

  if (!accessCode) {
    res.status(503).json({ error: "AI access control is not configured" });
    return;
  }

  if (providedCode !== accessCode) {
    res.status(401).json({ error: "Invalid access code" });
    return;
  }

  if (!kimiApiKey && !apiKey) {
    res.status(503).json({ error: "AI provider is not configured" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const text = String(body.text || "").trim();
  if (!text) {
    res.status(400).json({ error: "Missing text" });
    return;
  }

  const useKimi = Boolean(kimiApiKey);
  const baseUrl = useKimi
    ? (process.env.KIMI_BASE_URL || process.env.MOONSHOT_BASE_URL || "https://api.moonshot.cn/v1").replace(/\/$/, "")
    : "https://dashscope.aliyuncs.com/compatible-mode/v1";
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${useKimi ? kimiApiKey : apiKey}`,
    },
    body: JSON.stringify({
      model: useKimi ? (process.env.KIMI_MODEL || "kimi-k2-turbo-preview") : (process.env.QWEN_MODEL || "qwen-plus"),
      temperature: 0.4,
      max_tokens: 1600,
      messages: [
        {
          role: "system",
          content: [
            "Generate concise Markdown slides.",
            "Use --- on a separate line between slides.",
            "Use # for slide titles, ## for section headings, and - for bullets.",
            "Return only Markdown. Do not wrap the answer in code fences.",
          ].join(" "),
        },
        {
          role: "user",
          content: text.slice(0, 8000),
        },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    res.status(response.status).json({ error: data?.error?.message || "Qwen request failed" });
    return;
  }

  const markdown = data?.choices?.[0]?.message?.content || "";
  res.status(200).json({ markdown });
};
