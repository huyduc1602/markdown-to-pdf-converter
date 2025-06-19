import React, { useState } from "react";
import dynamic from "next/dynamic";

// Dynamic import để tránh SSR lỗi với mermaid
const Mermaid = dynamic(() => import("./Mermaid"), { ssr: false });

export default function DrawioToMermaid() {
  const [mermaidCode, setMermaidCode] = useState("");
  const [error, setError] = useState("");

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parser = new window.DOMParser();
      const xmlDoc = parser.parseFromString(text, "text/xml");
      const cells = xmlDoc.getElementsByTagName("mxCell");
      const nodes = {};
      const edges = [];
      for (let i = 0; i < cells.length; i++) {
        const cell = cells[i];
        const id = cell.getAttribute("id");
        const value = cell.getAttribute("value");
        const source = cell.getAttribute("source");
        const target = cell.getAttribute("target");
        const isVertex = cell.getAttribute("vertex") === "1";
        const isEdge = cell.getAttribute("edge") === "1";
        if (isVertex && value) {
          nodes[id] = decodeHtml(value.replace(/\n/g, "<br>"));
        }
        if (isEdge && source && target) {
          edges.push({ from: source, to: target });
        }
      }
      // Tạo Mermaid syntax
      let mermaid = "flowchart TD\n";
      const idMap = {};
      let charCode = 65; // A-Z
      for (const [id, label] of Object.entries(nodes)) {
        const shortId = String.fromCharCode(charCode++);
        idMap[id] = shortId;
        mermaid += `  ${shortId}[${label}]\n`;
      }
      for (const edge of edges) {
        const from = idMap[edge.from];
        const to = idMap[edge.to];
        if (from && to) {
          mermaid += `  ${from} --> ${to}\n`;
        }
      }
      setMermaidCode(mermaid);
      setError("");
    } catch (err) {
      setError("❌ Lỗi khi đọc file draw.io XML");
      setMermaidCode("");
    }
  };

  const decodeHtml = (html) => {
    if (typeof window === "undefined") return html;
    const txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
  };

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 24 }}>
      <h2>Chuyển file draw.io XML → Mermaid</h2>
      <input type="file" accept=".xml,.drawio" onChange={handleFileChange} />
      {error && <p style={{ color: "red" }}>{error}</p>}
      {mermaidCode && (
        <>
          <h3>Mã Mermaid:</h3>
          <pre style={{ background: "#eee", padding: "1rem", borderRadius: 8 }}>
            {mermaidCode}
          </pre>
          <h3>Sơ đồ trực tiếp:</h3>
          <div
            style={{
              background: "#fff",
              border: "1px solid #ddd",
              borderRadius: 8,
              padding: 16,
            }}
          >
            <Mermaid chart={mermaidCode} />
          </div>
        </>
      )}
    </div>
  );
}
