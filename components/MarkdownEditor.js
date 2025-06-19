import React, { useRef } from "react";
import { FaFileDownload, FaEye, FaFileCode, FaUpload } from "react-icons/fa";

const MarkdownEditor = ({
  markdown,
  setMarkdown,
  previewContent,
  loadSampleContent,
  convertToPDF,
  status,
  onShare,
}) => {
  const fileInputRef = useRef(null);

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setMarkdown(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const redirectToMermaidLive = () => {
    window.open("https://mermaid.live/", "_blank");
  };

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button
          onClick={loadSampleContent}
          className="btn sample-btn"
          title="Tải nội dung mẫu"
        >
          <FaFileCode /> Tải mẫu
        </button>
        <button
          onClick={triggerFileInput}
          className="btn upload-btn"
          title="Tải lên file Markdown"
        >
          <FaUpload /> Tải lên MD
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md, .markdown, .txt"
            style={{ display: "none" }}
          />
        </button>
        <button
          onClick={previewContent}
          className="btn preview-btn"
          title="Xem trước nội dung Markdown"
        >
          <FaEye /> Xem trước
        </button>
        <button
          onClick={convertToPDF}
          className="btn convert-btn"
          title="Xuất file PDF từ Markdown"
        >
          <FaFileDownload /> Xuất PDF
        </button>
        <button
          onClick={onShare}
          className="btn share-btn"
          type="button"
          title="Tạo liên kết chia sẻ"
        >
          🔗 Tạo link chia sẻ
        </button>
        <button
          onClick={redirectToMermaidLive}
          className="btn mermaid-btn"
          type="button"
          title="Tạo code Mermaid để xem luồng dữ liệu"
        >
          🧩 Tạo code Mermaid cho Markdown
        </button>
      </div>

      <div className="status-bar">
        {status && <div className="status-message">{status}</div>}
      </div>

      <div className="editor">
        <textarea
          value={markdown}
          onChange={(e) => setMarkdown(e.target.value)}
          placeholder="Nhập nội dung Markdown ở đây..."
          className="markdown-input"
          title="Nhập hoặc chỉnh sửa nội dung Markdown tại đây"
        ></textarea>
      </div>
    </div>
  );
};

export default MarkdownEditor;
