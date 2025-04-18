# md2slides Project Documentation

The `md2slides` project is a tool designed to convert Markdown content into HTML/PDF slides using Reveal.js/LaTex Beamer. 

Web interface: [md2slides](http://eecslab-22.case.edu/~jxx583/project/) **(CWRU VPN REQUIRED!)**

Demo Video: [CSDS285 Project Checkpoint Demo Video --- Jerry Xu](https://youtu.be/hp-8cZ9AwBg)

## Project Overview

The goal of this project is to create a script that can quickly generate slides from Markdown files, with convenient keyboard shortcuts to select themes and animations. The core of this functionality lies in the CGI script files within the project, which process and adjust Markdown text to make it compatible with both **Reveal.js** and **LaTeX Beamer** formats. This part of the project also best reflects the skills I’ve gained in the **CSDS285** course regarding scripting languages.

The `script.js` file in the project implements several additional features, such as inserting sample input with a button click. For users who are not familiar with Markdown, I referred to the documentation of LLM **Qwen-Plus** and integrated its API to help generate compliant Markdown documents for testing. This makes the project much more beginner-friendly, even though this part is not a requirement for CSDS285 nor the main focus of the project.

The conversion to Reveal.js is now mostly complete. However, since the HTML generated by Reveal.js is not ideal for transferring between devices, I plan to add an option to generate **LaTeX Beamer** files in the future. This will allow users to create PDFs via **Overleaf**, making it easier to save and share slides across different platforms. (Completed)

## 🛠️ To Get Started

To quickly test the basic functionality:

1. Click **"Use Sample Markdown"**
2. Select your preferred **theme** and **animation**
3. Click **"Generate Slides"**

To try out the **AI assistant feature**:

1. Click **"Use Sample Text"**
2. Click **"Generate Markdown"**
3. Finally, click **"Generate Slides"**

When entering your own text, please follow the placeholder instructions to ensure correct formatting.

## Folder Structure

```
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
```

## Detailed File Descriptions

### 1. `README.md`

This file provides an overview of the project, including its purpose, structure, and usage instructions.

### 2. `cgi-bin/convert.awk` (important!!!)

- A core script written in `awk` that processes HTTP requests (GET or POST).
- Converts user-submitted Markdown content into HTML slides (Reveal.js) or .tex file (Beamer).
- Features:
  - Parses HTTP parameters and decodes URL-encoded data.
  - Supports themes and animations for slides.
  - Outputs HTML with embedded Markdown for Reveal.js to render.

### 3. `project/index.html`

- The main HTML file for the web interface.
- Likely serves as the front-end for users to upload Markdown files or input content directly.

### 4. `project/sample_md.md` (4-6 can be changed based on your preference)

- A sample Markdown file provided for testing the conversion functionality.
- Can be used as an example to understand the expected input format.

### 5. `project/sample_pic.jpg`

- A sample image file included in the project.
- May be used for testing image embedding in slides or as part of the web interface.

### 6. `project/sample_text.txt`

- A sample plain text file for reference or testing purposes.

### 7. `project/script.js` (Integrated Sample Using and AI features)

- A JavaScript file that likely adds interactivity or functionality to the web interface.
- Could handle form submissions, dynamic updates, or other client-side logic.

### 8. `project/style.css` (extra)

- A CSS file for custom styling of the web interface.
- May include styles for the input form, buttons, or other UI elements.

## Usage Instructions

1. Deploy the `cgi-bin/convert.awk` script on a CGI-enabled server (e.g., Apache or Nginx).
2. Use the `index.html` file as the front-end for submitting Markdown content.
3. Test the functionality using the provided sample files (`sample_md.md`, `sample_pic.jpg`, etc.).
4. The server will process the Markdown input and return HTML slides styled with Reveal.js.

## Future Improvements

- Support for more theme.
