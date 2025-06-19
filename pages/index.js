import Head from "next/head";
import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/router";
import Header from "../components/Header";
import MarkdownEditor from "../components/MarkdownEditor";
import PreviewPane from "../components/PreviewPane";
import MermaidBlock from "../components/MermaidBlock";
import { marked } from "marked";
import LZString from "lz-string";

export default function Home() {
  const [status, setStatus] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isSharePreview, setIsSharePreview] = useState(false);
  const [previewNodes, setPreviewNodes] = useState([]);
  const previewRef = useRef();
  const router = useRouter();

  // On page load, if ?md= exists in URL, decode and set markdown, enable preview-only mode
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

  // Ensure preview is rendered after markdown is set from shared link
  useEffect(() => {
    if (isSharePreview && markdown) {
      previewContent(markdown);
    }
  }, [isSharePreview, markdown]);

  // Initialize mermaid once
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

  // Generate share link (compressed)
  const handleShare = () => {
    if (!markdown.trim()) {
      setStatus("⚠️ Vui lòng nhập nội dung Markdown để chia sẻ");
      return;
    }
    try {
      const compressed = LZString.compressToEncodedURIComponent(markdown);
      const url = `${window.location.origin}${window.location.pathname}?md=${compressed}`;
      setShareUrl(url);
      setStatus("✅ Đã tạo liên kết chia sẻ!");
      if (navigator.clipboard) navigator.clipboard.writeText(url);
    } catch {
      setStatus("⚠️ Không thể tạo liên kết chia sẻ!");
    }
  };

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

  // Preview markdown
  const previewContent = async (customMarkdown) => {
    const mdText =
      typeof customMarkdown === "string" ? customMarkdown : markdown;
    if (!mdText.trim()) {
      setStatus("⚠️ Vui lòng nhập nội dung Markdown");
      setPreviewNodes([]);
      return;
    }

    setStatus("Đang hiển thị xem trước...");

    const tokens = marked.lexer(mdText);
    const nodes = [];
    tokens.forEach((token, idx) => {
      if (token.type === "code" && token.lang === "mermaid") {
        nodes.push(<MermaidBlock key={"mermaid-" + idx} chart={token.text} />);
      } else if (token.type === "paragraph") {
        nodes.push(
          <p
            key={idx}
            dangerouslySetInnerHTML={{ __html: marked.parseInline(token.text) }}
          />
        );
      } else if (token.type === "heading") {
        const Tag = `h${token.depth}`;
        nodes.push(
          <Tag key={idx} dangerouslySetInnerHTML={{ __html: token.text }} />
        );
      } else if (token.type === "list") {
        const ListTag = token.ordered ? "ol" : "ul";
        nodes.push(
          <ListTag key={idx}>
            {token.items.map((item, i) => (
              <li
                key={i}
                dangerouslySetInnerHTML={{
                  __html: marked.parseInline(item.text),
                }}
              />
            ))}
          </ListTag>
        );
      } else if (token.type === "table") {
        nodes.push(
          <table key={idx}>
            <thead>
              <tr>
                {token.header.map((cell, i) => (
                  <th
                    key={i}
                    dangerouslySetInnerHTML={{
                      __html: marked.parseInline(
                        typeof cell === "string" ? cell : cell?.text || ""
                      ),
                    }}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {token.rows.map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td
                      key={cIdx}
                      dangerouslySetInnerHTML={{
                        __html: marked.parseInline(
                          typeof cell === "string" ? cell : cell?.text || ""
                        ),
                      }}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        );
      } else if (token.type === "html") {
        nodes.push(
          <div key={idx} dangerouslySetInnerHTML={{ __html: token.text }} />
        );
      } else if (token.type === "space") {
        nodes.push(<br key={idx} />);
      } else if (token.type === "blockquote") {
        nodes.push(<blockquote key={idx}>{token.text}</blockquote>);
      } else {
        if (typeof token.raw === "string" && token.raw.trim()) {
          nodes.push(
            <div
              key={idx}
              dangerouslySetInnerHTML={{ __html: marked.parse(token.raw) }}
            />
          );
        }
      }
    });
    setPreviewNodes(nodes);
    setStatus("✅ Đã cập nhật xem trước!");
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
        <script src="https://cdnjs.cloudflare.com/ajax/libs/marked/9.1.2/marked.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/mermaid/10.6.1/mermaid.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      </Head>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16, marginTop: 10, marginRight: 10 }}>
        <button onClick={() => router.push('/drawio-to-mermaid')} style={{ padding: '8px 16px', borderRadius: 6, background: '#667eea', color: '#fff', border: 'none', cursor: 'pointer' }}>
          Chuyển đổi Draw.io (xml) → Mermaid
        </button>
      </div>
      {/* ...existing main UI... */}
      <div className="content">
        {!isSharePreview && (
          <MarkdownEditor
            markdown={markdown}
            setMarkdown={setMarkdown}
            previewContent={previewContent}
            loadSampleContent={loadSampleContent}
            convertToPDF={convertToPDF}
            status={status}
            onShare={handleShare}
          />
        )}
        <PreviewPane
          previewNodes={previewNodes}
          isSharePreview={isSharePreview}
        />
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
            © {new Date().getFullYear()} Markdown to PDF Converter. All rights
            reserved.
          </p>
        </div>
      )}
    </div>
  );
}
