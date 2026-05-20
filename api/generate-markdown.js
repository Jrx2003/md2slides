module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const apiKey = process.env.DASHSCOPE_API_KEY || process.env.QWEN_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: "DASHSCOPE_API_KEY is not configured" });
    return;
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body || {};
  const text = String(body.text || "").trim();
  if (!text) {
    res.status(400).json({ error: "Missing text" });
    return;
  }

  const response = await fetch("https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.QWEN_MODEL || "qwen-plus",
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
