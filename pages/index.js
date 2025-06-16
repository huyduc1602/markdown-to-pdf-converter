import Head from "next/head";
import { useRef, useState, useEffect } from "react";
import Header from "../components/Header";
import MarkdownEditor from "../components/MarkdownEditor";
import PreviewPane from "../components/PreviewPane";
import MermaidBlock from "../components/MermaidBlock";
import { marked } from "marked";

export default function Home() {
  const [status, setStatus] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [shareUrl, setShareUrl] = useState("");
  const [isSharePreview, setIsSharePreview] = useState(false);
  const [previewNodes, setPreviewNodes] = useState([]);
  const previewRef = useRef();

  // On page load, if ?md= exists in URL, decode and set markdown, enable preview-only mode
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const md = params.get("md");
      if (md) {
        try {
          const decoded = decodeURIComponent(atob(md));
          setMarkdown(decoded);
          setStatus("✅ Loaded content from share link!");
          setIsSharePreview(true);
        } catch {
          setStatus("⚠️ Cannot decode content from link!");
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

  // Generate share link
  const handleShare = () => {
    if (!markdown.trim()) {
      setStatus("⚠️ Please enter Markdown content to share");
      return;
    }
    try {
      const encoded = btoa(encodeURIComponent(markdown));
      const url = `${window.location.origin}${window.location.pathname}?md=${encoded}`;
      setShareUrl(url);
      setStatus("✅ Share link created!");
      if (navigator.clipboard) navigator.clipboard.writeText(url);
    } catch {
      setStatus("⚠️ Cannot create share link!");
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
    setStatus("✅ Sample content loaded!");
  };

  // Preview markdown
  const previewContent = async (customMarkdown) => {
    const mdText =
      typeof customMarkdown === "string" ? customMarkdown : markdown;
    if (!mdText.trim()) {
      setStatus("⚠️ Please enter Markdown content");
      setPreviewNodes([]);
      return;
    }

    setStatus("Rendering preview...");

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
    setStatus("✅ Preview updated!");
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

  // Convert to PDF
  const convertToPDF = async () => {
    if (!markdown.trim()) {
      setStatus("⚠️ Please enter Markdown content");
      return;
    }
    setStatus("Generating PDF...");

    try {
      let html = marked.parse(markdown);
      html = await renderMermaidDiagrams(html);

      const tempDiv = document.createElement("div");
      tempDiv.className = "pdf-container";
      tempDiv.innerHTML = html;
      tempDiv.style.padding = "20px";
      tempDiv.style.width = "210mm";
      document.body.appendChild(tempDiv);

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
            },
            jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
          };

          const html2pdf = (await import("html2pdf.js")).default;
          await html2pdf().from(tempDiv).set(options).save();
          document.body.removeChild(tempDiv);
          setStatus("✅ PDF downloaded successfully!");
        } catch (error) {
          console.error("PDF generation error:", error);
          setStatus(`⚠️ PDF generation error: ${error.message}`);
        }
      }, 500);
    } catch (error) {
      console.error("Error during PDF preparation:", error);
      setStatus(`⚠️ PDF preparation error: ${error.message}`);
    }
  };

  return (
    <div className={isSharePreview ? "preview-fullpage" : "container"}>
      <Head>
        <title>Markdown to PDF Converter</title>
        <meta
          name="description"
          content="Online tool to convert Markdown to PDF"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      {!isSharePreview && <Header />}
      <div className={isSharePreview ? undefined : "content"}>
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
        <PreviewPane previewNodes={previewNodes} />
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
