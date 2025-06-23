import React from "react";
import MermaidBlock from "./MermaidBlock";
import { marked } from "marked";

/**
 * Render markdown content as React nodes, including Mermaid diagrams.
 * @param {string} markdown - Markdown content.
 * @returns {React.ReactNode[]}
 */
export function renderMarkdownPreview(markdown) {
  const tokens = marked.lexer(markdown);
  const nodes = [];
  tokens.forEach((token, idx) => {
    if (token.type === "code" && token.lang === "mermaid") {
      nodes.push(<MermaidBlock key={"mermaid-" + idx} chart={token.text} />);
    } else if (token.type === "paragraph") {
      nodes.push(
        <p key={idx} dangerouslySetInnerHTML={{ __html: marked.parseInline(token.text) }} />
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
            <li key={i} dangerouslySetInnerHTML={{ __html: marked.parseInline(item.text) }} />
          ))}
        </ListTag>
      );
    } else if (token.type === "table") {
      nodes.push(
        <table key={idx}>
          <thead>
            <tr>
              {token.header.map((cell, i) => (
                <th key={i} dangerouslySetInnerHTML={{ __html: marked.parseInline(typeof cell === "string" ? cell : cell?.text || "") }} />
              ))}
            </tr>
          </thead>
          <tbody>
            {token.rows.map((row, rIdx) => (
              <tr key={rIdx}>
                {row.map((cell, cIdx) => (
                  <td key={cIdx} dangerouslySetInnerHTML={{ __html: marked.parseInline(typeof cell === "string" ? cell : cell?.text || "") }} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    } else if (token.type === "html") {
      nodes.push(<div key={idx} dangerouslySetInnerHTML={{ __html: token.text }} />);
    } else if (token.type === "space") {
      nodes.push(<br key={idx} />);
    } else if (token.type === "blockquote") {
      nodes.push(<blockquote key={idx}>{token.text}</blockquote>);
    } else {
      if (typeof token.raw === "string" && token.raw.trim()) {
        nodes.push(
          <div key={idx} dangerouslySetInnerHTML={{ __html: marked.parse(token.raw) }} />
        );
      }
    }
  });
  return nodes;
}
