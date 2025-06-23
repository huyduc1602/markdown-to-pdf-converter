import Head from "next/head";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import MarkdownEditor from "../components/MarkdownEditor";
import PreviewPane from "../components/PreviewPane";
import { renderMarkdownPreview } from "../components/MarkdownPreview";
import LZString from "lz-string";
import Script from "next/script";

export default function Home() {
  // State for markdown content, status, sharing, and preview
  const [status, setStatus] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isSharePreview, setIsSharePreview] = useState(false);
  const [previewNodes, setPreviewNodes] = useState([]);
  const router = useRouter();
  // Load markdown from share link if present
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const md = params.get("md");
      if (md) {
        try {
          const decoded = LZString.decompressFromEncodedURIComponent(md);
          setMarkdown(decoded || "");
          setStatus("✅ Đã tải nội dung từ liên kết chia sẻ!");
          setIsSharePreview(true);
        } catch {
          setStatus("⚠️ Không thể giải mã nội dung từ liên kết!");
        }
      }
    }
  }, []);

  // Render preview after loading shared markdown
  useEffect(() => {
    if (isSharePreview && markdown) {
      handlePreview(markdown);
    }
  }, [isSharePreview, markdown]);

  // Initialize Mermaid only once
  useEffect(() => {
    if (typeof window !== "undefined") {
      import("mermaid").then((mod) => {
        const mermaid = mod.default;
        mermaid.initialize({
          startOnLoad: false,
          theme: "default",
          securityLevel: "loose",
          logLevel: "error",
          flowchart: { useMaxWidth: true, htmlLabels: true, curve: "basis" },
          er: {
            useMaxWidth: true,
            layoutDirection: "TB",
            entityPadding: 15,
            minEntityWidth: 100,
          },
        });
        window._mermaid = mermaid;
      });
    }
  }, []);
  // Generate shareable link for current markdown using TinyURL
  const handleShare = async () => {
    if (!markdown.trim()) {
      setStatus("⚠️ Vui lòng nhập nội dung Markdown để chia sẻ");
      return;
    }
    try {
      setStatus("Đang tạo liên kết chia sẻ...");
      const compressed = LZString.compressToEncodedURIComponent(markdown);
      const fullUrl = `${window.location.origin}${window.location.pathname}?md=${compressed}`;
      
      // Use TinyURL to shorten the link
      const tinyUrlResponse = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(fullUrl)}`);
      const shortUrl = await tinyUrlResponse.text();
      
      if (shortUrl && shortUrl.startsWith('https://tinyurl.com/')) {
        setShareUrl(shortUrl);
        setStatus("✅ Đã tạo liên kết chia sẻ ngắn!");
        if (navigator.clipboard) navigator.clipboard.writeText(shortUrl);
      } else {
        // Fallback to original URL if TinyURL fails
        setShareUrl(fullUrl);
        setStatus("✅ Liên kết chia sẻ đã được tạo!");
        if (navigator.clipboard) navigator.clipboard.writeText(fullUrl);
      }
    } catch {
      setStatus("⚠️ Không thể tạo liên kết chia sẻ!");
    }
  };

  // Load sample markdown content
  const loadSampleContent = () => {
    const sample = `# Main Title

## Subtitle

- List item 1
- List item 2

### 9. Entity Relationship Diagram

\`\`\`mermaid
erDiagram
    WMS_ARRIVE ||--o{ WMS_ARRIVE_ITEM : contains
    WMS_ARRIVE_ITEM ||--o{ WMS_STOCK_IN_ENTITY : maps_to
    WMS_STOCK_IN ||--o{ WMS_STOCK_IN_ITEM : contains
    WMS_STOCK_IN_ITEM ||--o{ WMS_STOCK_IN_ENTITY : contains
    WMS_STOCK_IN_ENTITY ||--o{ WMS_STOCK_ENTITY : updates
    WMS_PICKING ||--o{ WMS_PICKING_ENTITY : contains
    WMS_PICKING_ENTITY ||--o{ WMS_STOCK_OUT_ENTITY : maps_to
    WMS_STOCK_OUT ||--o{ WMS_STOCK_OUT_ITEM : contains
    WMS_STOCK_OUT_ITEM ||--o{ WMS_STOCK_OUT_ENTITY : contains
    WMS_STOCK_OUT_ENTITY ||--o{ WMS_STOCK_ENTITY : updates
\`\`\`

### 10. Outbound Data Flow

\`\`\`mermaid
flowchart TD
    A[User<br>PDA/Web] --> B[Send outbound request]
    B --> C[Call outbound API]
    C --> D[Call Store Procedure<br>usp_wms_custom_out_submit]
    D --> E[Update<br>wms_picking_entity<br>picked_quantity<br>is_completed]
    D --> F[Update<br>wms_stock_out_entity]
    E --> G[Calculate pick_rate<br>and ticket status]
\`\`\`

| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |`;
    setMarkdown(sample);
    setStatus("✅ Đã tải nội dung mẫu!");
  };

  // Render markdown preview as React nodes
  const handlePreview = (customMarkdown) => {
    const mdText = typeof customMarkdown === "string" ? customMarkdown : markdown;
    if (!mdText.trim()) {
      setStatus("⚠️ Vui lòng nhập nội dung Markdown");
      setPreviewNodes([]);
      return;
    }
    setStatus("Đang hiển thị bản xem trước...");
    setPreviewNodes(renderMarkdownPreview(mdText));
    setStatus("✅ Đã cập nhật bản xem trước!");
  };

  // Render Mermaid diagrams for PDF export
  const renderMermaidDiagrams = (html) => {
    if (typeof window === "undefined") return html;
    const parser = new window.DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const codeBlocks = doc.querySelectorAll("pre code");
    let counter = 0;
    for (let block of codeBlocks) {
      const text = block.textContent.replace(/^\s+|\s+$/g, "");
      if (text.startsWith("mermaid")) {
        const diagramContent = text.replace(/^mermaid\n?/, "");
        const id = `mermaid-${counter++}`;
        const div = doc.createElement("div");
        div.className = "mermaid";
        div.id = id;
        div.textContent = diagramContent;
        block.parentNode.replaceWith(div);
      }
    }
    return doc.body.innerHTML;
  };

  // Convert SVG to PNG (returns a data URL)
  async function svgToPngDataUrl(svgString, width, height) {
    const { Canvg } = await import("canvg");
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    const v = await Canvg.fromString(ctx, svgString);
    await v.render();
    return canvas.toDataURL("image/png");
  }

  // Convert to PDF
  const convertToPDF = async () => {
    if (!markdown.trim()) {
      setStatus("⚠️ Vui lòng nhập nội dung Markdown");
      return;
    }
    setStatus("Đang tạo file PDF...");

    try {
      let html = marked.parse(markdown);
      html = await renderMermaidDiagrams(html);

      const tempDiv = document.createElement("div");
      tempDiv.className = "pdf-container";
      tempDiv.innerHTML = html;
      tempDiv.style.padding = "20px";
      tempDiv.style.width = "210mm";
      document.body.appendChild(tempDiv);

      // Import mermaid directly and render all diagrams to SVG before exporting
      const mermaidMod = await import("mermaid");
      const mermaid = mermaidMod.default || mermaidMod;
      const mermaidDivs = tempDiv.querySelectorAll(".mermaid");
      let renderPromises = [];
      mermaidDivs.forEach((div, idx) => {
        const chart = div.textContent;
        const id = `pdf-mermaid-svg-${idx}`;
        renderPromises.push(
          mermaid
            .render(id, chart)
            .then(async ({ svg }) => {
              // Convert SVG to PNG and replace SVG with <img>
              const svgEl = new DOMParser().parseFromString(
                svg,
                "image/svg+xml"
              ).documentElement;
              // Estimate width/height
              let width = parseInt(svgEl.getAttribute("width")) || 800;
              let height = parseInt(svgEl.getAttribute("height")) || 400;
              // If width/height are in percent or not set, fallback to default
              if (isNaN(width)) width = 800;
              if (isNaN(height)) height = 400;
              const pngUrl = await svgToPngDataUrl(svg, width, height);
              const img = document.createElement("img");
              img.src = pngUrl;
              img.style.maxWidth = "100%";
              img.style.display = "block";
              div.parentNode.replaceChild(img, div);
            })
            .catch(() => {
              div.innerHTML =
                '<div style="color:#b00">Mermaid render error</div>';
            })
        );
      });
      await Promise.all(renderPromises);

      setTimeout(async () => {
        try {
          const options = {
            margin: 10,
            filename: "markdown-document.pdf",
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: {
              scale: 2,
              useCORS: true,
              logging: false,
              backgroundColor: "#fff",
              allowTaint: true,
              useCORS: true,
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          };

          const html2pdf = (await import("html2pdf.js")).default;
          await html2pdf().from(tempDiv).set(options).save();
          document.body.removeChild(tempDiv);
          setStatus("✅ Đã tải file PDF thành công!");
        } catch (error) {
          console.error("PDF generation error:", error);
          setStatus(`⚠️ Lỗi tạo file PDF: ${error.message}`);
        }
      }, 500);
    } catch (error) {
      console.error("Error during PDF preparation:", error);
      setStatus(`⚠️ Lỗi chuẩn bị file PDF: ${error.message}`);
    }
  };

  return (
    <div className="container">
      <Head>
        <title>Markdown to PDF Converter</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </Head>
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.2/marked.min.js" strategy="beforeInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js" strategy="beforeInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" strategy="beforeInteractive" />
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16, marginTop: 10, marginRight: 10 }}>
        <button
          onClick={() => router.push("/drawio-to-mermaid")}
          style={{ padding: "8px 16px", borderRadius: 6, background: "#667eea", color: "#fff", border: "none", cursor: "pointer" }}
        >
          Draw.io (xml) → Mermaid
        </button>
      </div>
      <div className="content">
        {!isSharePreview && (
          <MarkdownEditor
            markdown={markdown}
            setMarkdown={setMarkdown}
            previewContent={handlePreview}
            loadSampleContent={loadSampleContent}
            convertToPDF={convertToPDF}
            status={status}
            onShare={handleShare}
          />
        )}
        <PreviewPane previewNodes={previewNodes} isSharePreview={isSharePreview} />
      </div>
      {!isSharePreview && (
        <div className="footer">
          {shareUrl && (
            <div style={{ marginBottom: 10 }}>
              <b>Share link:</b>{" "}
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                {shareUrl}
              </a>
              <span style={{ color: "#28a745", marginLeft: 8 }}>
                (Copied to clipboard)
              </span>
            </div>
          )}
          <p>
            © {new Date().getFullYear()} Markdown to PDF Converter. All rights reserved.
          </p>
        </div>
      )}
    </div>
  );
}
