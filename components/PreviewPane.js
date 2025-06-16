import React, { useState } from "react";
import { FaExpand, FaCompress } from "react-icons/fa";

const PreviewPane = ({ previewNodes }) => {
  const [isFullScreen, setIsFullScreen] = useState(false);

  // Toggle full screen mode
  const toggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };

  return (
    <div className={`preview-container ${isFullScreen ? "fullscreen" : ""}`}>
      <div className="preview-header">
        <h3 className="preview-title">Xem trước</h3>
        <button
          onClick={toggleFullScreen}
          className="btn fullscreen-btn"
          aria-label={
            isFullScreen ? "Thoát chế độ toàn màn hình" : "Xem toàn màn hình"
          }
        >
          {isFullScreen ? <FaCompress /> : <FaExpand />}
        </button>
      </div>
      <div id="preview-content" className="preview-content">
        {previewNodes}
      </div>
    </div>
  );
};

export default PreviewPane;
