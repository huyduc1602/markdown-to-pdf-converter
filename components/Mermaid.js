import React, { useEffect, useRef } from "react";
import mermaid from "mermaid";

const Mermaid = ({ chart, config }) => {
  const ref = useRef(null);

  useEffect(() => {
    if (!chart || !ref.current) return;

    // Initialize mermaid only once globally
    mermaid.initialize({
      startOnLoad: false,
      theme: "default",
      ...config,
    });

    // Unique ID để tránh conflict giữa các render
    const renderId = `mermaid-${Math.random().toString(36).substring(2, 9)}`;

    const renderDiagram = async () => {
      try {
        // Validate chart
        mermaid.parse(chart);

        // Render to SVG
        const { svg } = await mermaid.render(renderId, chart);

        // Inject SVG into the container
        if (ref.current) {
          ref.current.innerHTML = svg;
        }
      } catch (err) {
        if (ref.current) {
          ref.current.innerHTML = `<div style='color:#b00'><b>Mermaid syntax error:</b><br>${err.message}</div>`;
        }
      }
    };

    renderDiagram();

    // Cleanup content on unmount or rerender
    return () => {
      if (ref.current) ref.current.innerHTML = "";
    };
  }, [chart, config]);

  return <div ref={ref} className="mermaid-react" />;
};

export default Mermaid;
