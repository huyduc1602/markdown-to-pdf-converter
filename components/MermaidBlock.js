import React from "react";
import Mermaid from "./Mermaid";

const MermaidBlock = ({ chart }) => {
  return (
    <div className="mermaid-block">
      <Mermaid chart={chart} />
    </div>
  );
};

export default MermaidBlock;
