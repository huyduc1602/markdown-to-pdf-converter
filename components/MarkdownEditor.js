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

  return (
    <div className="editor-container">
      <div className="toolbar">
        <button onClick={loadSampleContent} className="btn sample-btn">
          <FaFileCode /> Tải mẫu
        </button>
        <button onClick={triggerFileInput} className="btn upload-btn">
          <FaUpload /> Tải lên MD
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".md, .markdown, .txt"
            style={{ display: "none" }}
          />
        </button>
        <button onClick={previewContent} className="btn preview-btn">
          <FaEye /> Xem trước
        </button>
        <button onClick={convertToPDF} className="btn convert-btn">
          <FaFileDownload /> Xuất PDF
        </button>
        <button onClick={onShare} className="btn share-btn" type="button">
          🔗 Tạo link chia sẻ
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
        ></textarea>
      </div>
    </div>
  );
};

export default MarkdownEditor;
