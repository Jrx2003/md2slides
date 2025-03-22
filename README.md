# md2slides Project Documentation

The `md2slides` project is a tool designed to convert Markdown content into HTML slides using Reveal.js. Below is an overview of the folder structure and the functionality of each file. You can try it through this web interface: [md2slides](http://eecslab-22.case.edu/~jxx583/project/). CWRU VPN REQUIRED!!!

## Folder Structure

md2slides
├── README.md          # Project documentation (this file)
├── cgi-bin
│   ├── convert.awk    # Core script for Markdown to HTML slide conversion
├── project
│   ├── index.html     # Main entry point for the web interface
│   ├── sample_md.md   # Sample Markdown file for testing
│   ├── sample_pic.jpg # Sample image used in the project
│   ├── sample_text.txt# Sample text file for reference
│   ├── script.js      # JavaScript file for additional functionality
│   ├── style.css      # CSS file for custom styling

## File Descriptions

### 1. `README.md`

This file provides an overview of the project, including its purpose, structure, and usage instructions.

### 2. `cgi-bin/convert.awk`

- A core script written in `awk` that processes HTTP requests (GET or POST).
- Converts user-submitted Markdown content into HTML slides using Reveal.js.
- Features:
  - Parses HTTP parameters and decodes URL-encoded data.
  - Supports themes and animations for slides.
  - Outputs HTML with embedded Markdown for Reveal.js to render.

### 3. `project/index.html`

- The main HTML file for the web interface.
- Likely serves as the front-end for users to upload Markdown files or input content directly.

### 4. `project/sample_md.md`

- A sample Markdown file provided for testing the conversion functionality.
- Can be used as an example to understand the expected input format.

### 5. `project/sample_pic.jpg`

- A sample image file included in the project.
- May be used for testing image embedding in slides or as part of the web interface.

### 6. `project/sample_text.txt`

- A sample plain text file for reference or testing purposes.

### 7. `project/script.js`

- A JavaScript file that likely adds interactivity or functionality to the web interface.
- Could handle form submissions, dynamic updates, or other client-side logic.

### 8. `project/style.css`

- A CSS file for custom styling of the web interface.
- May include styles for the input form, buttons, or other UI elements.

## Usage Instructions

1. Deploy the `cgi-bin/convert.awk` script on a CGI-enabled server (e.g., Apache or Nginx).
2. Use the `index.html` file as the front-end for submitting Markdown content.
3. Test the functionality using the provided sample files (`sample_md.md`, `sample_pic.jpg`, etc.).
4. The server will process the Markdown input and return HTML slides styled with Reveal.js.

## Future Improvements

- Support for Latex Beamer.
