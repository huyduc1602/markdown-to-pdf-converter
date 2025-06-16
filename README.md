# Markdown to PDF Converter

A Next.js web app for converting Markdown to PDF, supporting Mermaid diagrams, file upload, live preview, and shareable preview links.

## Features

- Live Markdown editor and preview
- Render Mermaid diagrams (flowchart, erDiagram, etc.)
- Upload and preview Markdown files
- Export to PDF (with diagrams)
- Generate shareable preview links (with full-page preview mode)
- Modern, responsive UI

## Usage

1. **Edit Markdown:** Use the editor to write or paste your Markdown content.
2. **Preview:** See the rendered Markdown and diagrams in real time.
3. **Upload:** Click 'Upload' to load a Markdown file.
4. **Export PDF:** Click 'Export PDF' to download your document.
5. **Share:** Click 'Create Share Link' to generate a URL for preview-only sharing.

## Development

- Clone the repo
- Install dependencies: `npm install`
- Run locally: `npm run dev`

## Tech Stack

- Next.js
- React
- marked (Markdown parser)
- mermaid (diagram rendering)
- html2pdf.js (PDF export)

## License

MIT
