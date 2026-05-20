const state = {
  output: "reveal",
  generated: "",
  fileName: "slides.html",
};

const els = {
  markdownInput: document.getElementById("markdownInput"),
  notesInput: document.getElementById("notesInput"),
  sourceStats: document.getElementById("sourceStats"),
  previewMode: document.getElementById("previewMode"),
  previewFrame: document.getElementById("previewFrame"),
  previewFrameWrap: document.getElementById("previewFrameWrap"),
  codePreview: document.getElementById("codePreview"),
  revealControls: document.getElementById("revealControls"),
  beamerControls: document.getElementById("beamerControls"),
  revealTheme: document.getElementById("revealTheme"),
  beamerTheme: document.getElementById("beamerTheme"),
  transition: document.getElementById("transition"),
  accessCode: document.getElementById("accessCode"),
  aiStatus: document.getElementById("aiStatus"),
  generateMarkdown: document.getElementById("generateMarkdown"),
};

const defaultMarkdown = `# Quarterly Finance Review

## Executive summary
- Revenue grew 8% quarter over quarter
- Gross margin expanded by 2.1 percentage points
- Cash conversion stayed below target

---

# Performance drivers

- **Revenue:** enterprise renewals and higher services attach
- **Margin:** lower hosting costs and price discipline
- **Risk:** receivables aging in two regional accounts

---

# Next steps

- Validate assumptions with the client finance team
- Prepare sensitivity analysis for pricing scenarios
- Align on Monday's steering committee narrative`;

const sampleNotes = `Client finance review:
Revenue increased 8 percent quarter over quarter. Gross margin improved by 2.1 points because hosting cost declined and pricing discipline improved. Cash conversion is still below target. Two regional accounts have receivables aging risk. The team needs sensitivity analysis for three pricing scenarios and a concise steering committee story for Monday.`;

init();

function init() {
  els.markdownInput.value = defaultMarkdown;

  document.querySelectorAll("[data-output]").forEach((button) => {
    button.addEventListener("click", () => setOutputMode(button.dataset.output));
  });

  document.getElementById("useSampleMarkdown").addEventListener("click", () => {
    els.markdownInput.value = defaultMarkdown;
    render();
  });

  document.getElementById("clearMarkdown").addEventListener("click", () => {
    els.markdownInput.value = "";
    render();
  });

  document.getElementById("useSampleNotes").addEventListener("click", () => {
    els.notesInput.value = sampleNotes;
    setStatus("");
  });

  els.generateMarkdown.addEventListener("click", generateMarkdownFromNotes);
  document.getElementById("copyOutput").addEventListener("click", copyOutput);
  document.getElementById("downloadOutput").addEventListener("click", downloadOutput);
  document.getElementById("openOutput").addEventListener("click", openOutput);

  [els.markdownInput, els.revealTheme, els.beamerTheme, els.transition].forEach((node) => {
    node.addEventListener("input", debounce(render, 180));
    node.addEventListener("change", render);
  });

  render();
}

function setOutputMode(mode) {
  state.output = mode;
  document.querySelectorAll("[data-output]").forEach((button) => {
    button.classList.toggle("active", button.dataset.output === mode);
  });
  els.revealControls.classList.toggle("hidden", mode !== "reveal");
  els.beamerControls.classList.toggle("hidden", mode !== "beamer");
  render();
}

function render() {
  const markdown = els.markdownInput.value.trim();
  const slides = splitSlides(markdown);
  const wordCount = markdown ? markdown.split(/\s+/).filter(Boolean).length : 0;
  els.sourceStats.textContent = `${slides.length} slide${slides.length === 1 ? "" : "s"} · ${wordCount} words`;

  if (state.output === "beamer") {
    state.generated = buildBeamer(markdown, els.beamerTheme.value);
    state.fileName = "slides.tex";
    els.previewMode.textContent = "LaTeX Beamer";
    els.previewFrameWrap.classList.add("hidden");
    els.codePreview.classList.remove("hidden");
    els.codePreview.textContent = state.generated;
    return;
  }

  state.generated = buildReveal(markdown, els.revealTheme.value, els.transition.value);
  state.fileName = "slides.html";
  els.previewMode.textContent = "Reveal.js HTML";
  els.codePreview.classList.add("hidden");
  els.previewFrameWrap.classList.remove("hidden");
  els.previewFrame.srcdoc = state.generated;
}

async function generateMarkdownFromNotes() {
  const notes = els.notesInput.value.trim();
  if (!notes) {
    setStatus("Add notes first.", true);
    return;
  }

  els.generateMarkdown.disabled = true;
  setStatus("Generating markdown...");

  try {
    const accessCode = els.accessCode.value.trim();
    if (!accessCode) {
      throw new Error("Access code is required for AI generation");
    }

    const response = await fetch("/api/generate-markdown", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Access-Code": accessCode,
      },
      body: JSON.stringify({ text: notes }),
    });

    if (!response.ok) {
      const error = await safeJson(response);
      throw new Error(error?.error || `Request failed with ${response.status}`);
    }

    const data = await response.json();
    els.markdownInput.value = data.markdown || outlineToMarkdown(notes);
    setStatus("Markdown generated.");
  } catch (error) {
    els.markdownInput.value = outlineToMarkdown(notes);
    setStatus(`Used local outline fallback. ${error.message}`, true);
  } finally {
    els.generateMarkdown.disabled = false;
    render();
  }
}

function buildReveal(markdown, theme, transition) {
  const safeMarkdown = escapeScript(markdown || "# Untitled\n\nAdd slide content here.");
  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Slides</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/theme/${theme}.css">
</head>
<body>
  <div class="reveal">
    <div class="slides">
      <section data-markdown>
        <script type="text/template">
${safeMarkdown}
        </script>
      </section>
    </div>
  </div>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5/dist/reveal.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/reveal.js@5/plugin/markdown/markdown.js"></script>
  <script>
    Reveal.initialize({
      hash: true,
      transition: "${transition}",
      plugins: [RevealMarkdown]
    });
  </script>
</body>
</html>`;
}

function buildBeamer(markdown, theme) {
  const slides = splitSlides(markdown || "# Untitled\n\nAdd slide content here.");
  const body = slides.map(slideToBeamer).join("\n");
  return `\\documentclass{beamer}
\\usetheme{${theme}}
\\usepackage{graphicx}
\\begin{document}
${body}
\\end{document}
`;
}

function slideToBeamer(slide) {
  const lines = slide.split("\n");
  let title = "";
  const content = [];
  let inList = false;

  lines.forEach((rawLine) => {
    let line = rawLine.trimEnd();
    if (!line.trim()) {
      return;
    }

    if (!title && line.startsWith("# ")) {
      title = line.replace(/^# /, "").trim();
      return;
    }

    if (line.startsWith("## ")) {
      closeList();
      content.push(`{\\Large\\textbf{${inlineLatex(line.replace(/^## /, ""))}}}\\par`);
      return;
    }

    if (line.startsWith("### ")) {
      closeList();
      content.push(`{\\large\\textbf{${inlineLatex(line.replace(/^### /, ""))}}}\\par`);
      return;
    }

    if (line.startsWith("- ")) {
      if (!inList) {
        content.push("\\begin{itemize}");
        inList = true;
      }
      content.push(`  \\item ${inlineLatex(line.replace(/^- /, ""))}`);
      return;
    }

    if (line.startsWith("> ")) {
      closeList();
      content.push(`\\textit{${inlineLatex(line.replace(/^> /, ""))}}\\par`);
      return;
    }

    const imageMatch = line.match(/^!\[\]\(([^)]+)\)/);
    if (imageMatch) {
      closeList();
      content.push(`\\begin{center}\\includegraphics[width=0.8\\linewidth]{${escapeLatex(imageMatch[1])}}\\end{center}`);
      return;
    }

    closeList();
    content.push(`${inlineLatex(line)}\\par`);
  });

  closeList();
  return `\\begin{frame}
\\frametitle{${inlineLatex(title || "Untitled")}}
${content.join("\n")}
\\end{frame}`;

  function closeList() {
    if (inList) {
      content.push("\\end{itemize}");
      inList = false;
    }
  }
}

function outlineToMarkdown(text) {
  const sentences = text
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((item) => item.trim())
    .filter(Boolean);

  const first = sentences.slice(0, 3);
  const second = sentences.slice(3, 6);
  const third = sentences.slice(6, 9);

  return [
    "# Executive summary",
    ...toBullets(first.length ? first : [text.slice(0, 160)]),
    "",
    "---",
    "",
    "# Key details",
    ...toBullets(second.length ? second : ["Add supporting evidence", "Quantify the impact", "Identify open questions"]),
    "",
    "---",
    "",
    "# Next steps",
    ...toBullets(third.length ? third : ["Validate assumptions", "Prepare discussion materials", "Align with stakeholders"]),
  ].join("\n");
}

function toBullets(items) {
  return items.map((item) => `- ${item.replace(/^[-*]\s*/, "")}`);
}

function splitSlides(markdown) {
  const slides = markdown
    .split(/\n---+\n/g)
    .map((slide) => slide.trim())
    .filter(Boolean);
  return slides.length ? slides : [""];
}

function inlineLatex(text) {
  const escaped = escapeLatex(text);
  return escaped.replace(/\*\*([^*]+)\*\*/g, "\\\\textbf{$1}");
}

function escapeLatex(text) {
  return String(text)
    .replace(/\\/g, "\\textbackslash{}")
    .replace(/&/g, "\\&")
    .replace(/%/g, "\\%")
    .replace(/\$/g, "\\$")
    .replace(/#/g, "\\#")
    .replace(/_/g, "\\_")
    .replace(/{/g, "\\{")
    .replace(/}/g, "\\}")
    .replace(/~/g, "\\textasciitilde{}")
    .replace(/\^/g, "\\textasciicircum{}");
}

function escapeScript(markdown) {
  return markdown.replace(/<\/script/gi, "<\\/script");
}

async function copyOutput() {
  await navigator.clipboard.writeText(state.generated);
  setStatus("Output copied.");
}

function downloadOutput() {
  const blob = new Blob([state.generated], { type: state.output === "reveal" ? "text/html" : "text/plain" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = state.fileName;
  link.click();
  URL.revokeObjectURL(url);
}

function openOutput() {
  const blob = new Blob([state.generated], { type: state.output === "reveal" ? "text/html" : "text/plain" });
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank", "noopener,noreferrer");
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function setStatus(message, isError = false) {
  els.aiStatus.textContent = message;
  els.aiStatus.classList.toggle("error", isError);
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function debounce(fn, wait) {
  let timer = null;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), wait);
  };
}
