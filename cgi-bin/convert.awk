#!/usr/bin/awk -f
###############################################################################
# AWK CGI Script to convert Markdown to either Reveal.js HTML or LaTeX Beamer.
###############################################################################

# URL-decode function
function urldecode(str, i, len, result, hex, c) {
  len = length(str)
  result = ""
  i = 1
  while (i <= len) {
    c = substr(str, i, 1)
    if (c == "+") {
      result = result " "
    } else if (c == "%" && i+2 <= len) {
      hex = substr(str, i+1, 2)
      result = result sprintf("%c", strtonum("0x" hex))
      i += 2
    } else {
      result = result c
    }
    i++
  }
  return result
}

# Remove trailing carriage return
function stripCR(line) {
  sub(/\r$/, "", line)
  return line
}

BEGIN {
  print "Content-type: text/html"
  print ""

  # Read POST data
  method = ENVIRON["REQUEST_METHOD"]
  if (method == "POST") {
    getline postData < "-"
  } else {
    postData = ENVIRON["QUERY_STRING"]
  }

  # Parse parameters
  n = split(postData, params, "&")
  for (i = 1; i <= n; i++) {
    split(params[i], kv, "=")
    key = kv[1]
    value = (length(kv) > 1 ? kv[2] : "")
    data[key] = urldecode(value)
  }

  md = data["md"]
  convType = data["type"]

  # For beamer, use a beamer-specific theme parameter; if not provided, default to Madrid.
  if (convType == "beamer") {
    if (data["beamerTheme"] != "") {
      theme = data["beamerTheme"]
    } else {
      theme = "Madrid"
    }
  } else {
    theme = data["theme"]
    if (theme == "") { theme = "black" }
    animation = data["animation"]
    if (animation == "") { animation = "slide" }
  }

  numLines = split(md, lines, "\n")

  if (convType == "beamer") {
    # Build LaTeX code in variable "latex"
    latex = ""
    latex = latex "\\documentclass{beamer}\n"
    latex = latex "\\usetheme{" theme "}\n"
    latex = latex "\\usepackage{graphicx}\n"
    latex = latex "\\begin{document}\n"
    slideOpen = 0
    inList = 0
    for (i = 1; i <= numLines; i++) {
      line = stripCR(lines[i])
      if (line == "---") {
        if (inList) {
          latex = latex "\\end{itemize}\n"
          inList = 0
        }
        if (slideOpen) {
          latex = latex "\\end{frame}\n"
          slideOpen = 0
        }
        # Start new frame
        latex = latex "\\begin{frame}\n"
        slideOpen = 1
        continue
      }
      # If no frame open, start one.
      if (!slideOpen) {
        latex = latex "\\begin{frame}\n"
        slideOpen = 1
      }
      # Process headings:
      if (line ~ /^# /) {
        sub(/^# /, "", line)
        # Convert inline bold using gensub
        line = gensub(/\*\*([^*]+)\*\*/, "\\\\textbf{\\1}", "g", line)
        latex = latex "\\frametitle{" line "}\n"
      }
      else if (line ~ /^## /) {
        sub(/^## /, "", line)
        line = gensub(/\*\*([^*]+)\*\*/, "\\\\textbf{\\1}", "g", line)
        # Output as a large bold heading within the frame
        latex = latex "{\\Large\\textbf{" line "}}\\par\n"
      }
      else if (line ~ /^### /) {
        sub(/^### /, "", line)
        line = gensub(/\*\*([^*]+)\*\*/, "\\\\textbf{\\1}", "g", line)
        # Output as a slightly smaller bold heading
        latex = latex "{\\large\\textbf{" line "}}\\par\n"
      }
      # Process bullet items: lines starting with "- "
      else if (line ~ /^- /) {
        if (!inList) {
          latex = latex "\\begin{itemize}\n"
          inList = 1
        }
        sub(/^- /, "", line)
        line = gensub(/\*\*([^*]+)\*\*/, "\\\\textbf{\\1}", "g", line)
        latex = latex "  \\item " line "\n"
      }
      # Process block quotes: lines starting with "> "
      else if (line ~ /^> /) {
        sub(/^> /, "", line)
        line = gensub(/\*\*([^*]+)\*\*/, "\\\\textbf{\\1}", "g", line)
        latex = latex "\\textit{" line "}\n"
      }
      # Process image syntax: ![](URL)
      else if (match(line, /!\[\]\(([^)]+)\)/, arr)) {
        latex = latex "\\begin{center}\\includegraphics[width=0.8\\linewidth]{" arr[1] "}\\end{center}\n"
      }
      # Normal text line
      else {
        line = gensub(/\*\*([^*]+)\*\*/, "\\\\textbf{\\1}", "g", line)
        latex = latex line "\n"
      }
    }
    if (inList) {
      latex = latex "\\end{itemize}\n"
      inList = 0
    }
    if (slideOpen) {
      latex = latex "\\end{frame}\n"
    }
    latex = latex "\\end{document}\n"

    # Output an HTML page with a textarea containing the LaTeX code.
    print "<!doctype html>"
    print "<html><head><meta charset=\"utf-8\"><title>LaTeX Beamer Code</title>"
    print "<link rel=\"stylesheet\" href=\"https://maxcdn.bootstrapcdn.com/bootstrap/4.5.2/css/bootstrap.min.css\">"
    print "</head><body>"
    print "<div class=\"container my-4\">"
    print "  <h1 class=\"mb-3\">LaTeX Beamer Code</h1>"
    print "  <div class=\"alert alert-info\">"
    print "    <p>Copy the code below and paste it into a new <a href=\"https://www.overleaf.com\" target=\"_blank\">Overleaf</a> project. Save it as a <code>.tex</code> file and compile to generate your PDF slides. For images, you need to upload them to the <a href=\"https://www.overleaf.com\" target=\"_blank\">Overleaf</a> project and modify the corresponding image path.</p>"
    print "  </div>"
    print "  <div class=\"form-group\">"
    print "    <textarea id=\"latexOutput\" class=\"form-control\" rows=\"20\">" latex "</textarea>"
    print "  </div>"
    print "</div>"
    print "</body></html>"
    exit
  }

  # Reveal.js HTML output using the Markdown plugin.
  print "<!doctype html>"
  print "<html><head><meta charset=\"utf-8\"><title>Reveal.js Slides</title>"
  print "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/reveal.js/dist/reveal.css\">"
  print "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/reveal.js/dist/theme/" theme ".css\">"
  print "</head><body>"
  print "<div class=\"reveal\">"
  print "  <div class=\"slides\">"
  print "    <section data-markdown>"
  print "      <script type=\"text/template\">"
  for (i = 1; i <= numLines; i++) {
    line = stripCR(lines[i])
    print line
  }
  print "      </script>"
  print "    </section>"
  print "  </div>"
  print "</div>"
  print "<script src=\"https://cdn.jsdelivr.net/npm/reveal.js/dist/reveal.js\"></script>"
  print "<script src=\"https://cdn.jsdelivr.net/npm/reveal.js/plugin/markdown/markdown.js\"></script>"
  print "<script>"
  print "Reveal.initialize({"
  print "  transition: \"" animation "\","
  print "  plugins: [ RevealMarkdown ]"
  print "});"
  print "</script>"
  print "</body></html>"
  exit
}
