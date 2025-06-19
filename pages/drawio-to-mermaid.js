import dynamic from "next/dynamic";

const DrawioToMermaid = dynamic(() => import("../components/DrawioToMermaid"), { ssr: false });

export default function DrawioToMermaidPage() {
  return <DrawioToMermaid />;
}
