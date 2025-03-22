#!/usr/bin/awk -f

# URL-decode function
function urldecode(str,    i, len, result, hex, c) {
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

# Strip carriage returns from the end of a line (for Windows-style \r\n)
function stripCR(line) {
  sub(/\r$/, "", line)
  return line
}

BEGIN {
  # Output HTTP header
  print "Content-type: text/html"
  print ""

  # Read POST or GET data
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

  # Retrieve user-submitted Markdown, theme, animation, etc.
  md = data["md"]
  theme = data["theme"]
  animation = data["animation"]
  if (theme == "") {
    theme = "black"  # default theme
  }
  if (animation == "") {
    animation = "slide"  # default transition
  }

  # Split the Markdown into lines so we can remove carriage returns
  numLines = split(md, lines, "\n")

  # Start outputting the HTML
  print "<!doctype html>"
  print "<html><head><meta charset=\"utf-8\"><title>Reveal.js Slides</title>"
  print "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/reveal.js/dist/reveal.css\">"
  print "<link rel=\"stylesheet\" href=\"https://cdn.jsdelivr.net/npm/reveal.js/dist/theme/" theme ".css\">"
  print "</head><body>"
  print "<div class=\"reveal\">"
  print "  <div class=\"slides\">"

  # Place the raw Markdown in a <section data-markdown> block
  # Reveal's markdown plugin expects <script type=\"text/template\"> inside
  print "    <section data-markdown>"
  print "      <script type=\"text/template\">"

  for (i = 1; i <= numLines; i++) {
    line = stripCR(lines[i])
    print line
  }

  print "      </script>"
  print "    </section>"

  print "  </div>"  # end .slides
  print "</div>"    # end .reveal

  # Include Reveal.js and the Markdown plugin
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
