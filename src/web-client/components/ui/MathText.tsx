"use client";

import React, { useMemo } from "react";
import katex from "katex";
import "katex/dist/katex.min.css";

interface MathTextProps {
  content?: string | null;
  className?: string;
  as?: "span" | "div" | "p";
}

/**
 * Safely renders mixed plain text and LaTeX math formulas ($...$ for inline, $$...$$ for display).
 */
export function MathText({ content, className = "", as = "span" }: MathTextProps) {
  const renderedHtml = useMemo(() => {
    if (!content) return "";

    // Regex to detect $$display math$$ and $inline math$
    // Using negative lookbehind and lookahead to avoid matching escaped \$
    const mathRegex = /(\$\$[\s\S]+?\$\$|\$[^\$\n]+?\$)/g;

    const parts = content.split(mathRegex);

    return parts
      .map((part) => {
        if (!part) return "";

        // Display math: $$...$$
        if (part.startsWith("$$") && part.endsWith("$$")) {
          const formula = part.slice(2, -2).trim();
          try {
            return katex.renderToString(formula, {
              displayMode: true,
              throwOnError: false,
            });
          } catch {
            return `<div class="katex-error font-mono text-red-500">${escapeHtml(part)}</div>`;
          }
        }

        // Inline math: $...$
        if (part.startsWith("$") && part.endsWith("$")) {
          const formula = part.slice(1, -1).trim();
          try {
            return katex.renderToString(formula, {
              displayMode: false,
              throwOnError: false,
            });
          } catch {
            return `<span class="katex-error font-mono text-red-500">${escapeHtml(part)}</span>`;
          }
        }

        // Regular text: sanitize & preserve newlines
        return escapeHtml(part).replace(/\n/g, "<br/>");
      })
      .join("");
  }, [content]);

  const Component = as;

  return (
    <Component
      className={`math-rendered-text ${className}`}
      dangerouslySetInnerHTML={{ __html: renderedHtml }}
    />
  );
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

