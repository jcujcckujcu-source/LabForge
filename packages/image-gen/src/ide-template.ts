import React from "react";
import type { TokenLine } from "./highlight";

interface IdeTemplateProps {
  fileName: string;
  tokenLines: TokenLine[];
}

/**
 * Builds a Satori-compatible React element tree representing a Visual Studio 2022
 * code editor window. All styles are inline (Satori requirement).
 */
export function buildIdeElement(props: IdeTemplateProps): React.ReactElement {
  const { fileName, tokenLines } = props;

  // Line numbers column
  const lineNumbers = tokenLines.map((_, i) =>
    React.createElement(
      "div",
      {
        key: `ln-${i}`,
        style: {
          display: "flex",
          color: "#858585",
          fontSize: 13,
          lineHeight: "21px",
          fontFamily: "monospace",
          paddingRight: 4,
          minWidth: 28,
          justifyContent: "flex-end",
        },
      },
      String(i + 1)
    )
  );

  // Code lines with token spans
  const codeLines = tokenLines.map((line, lineIdx) => {
    const spans = line.map((token, tokenIdx) =>
      React.createElement(
        "span",
        {
          key: `t-${lineIdx}-${tokenIdx}`,
          style: {
            color: token.color,
            fontStyle: token.fontStyle ?? "normal",
          },
        },
        token.content
      )
    );

    return React.createElement(
      "div",
      {
        key: `line-${lineIdx}`,
        style: {
          display: "flex",
          flexDirection: "row",
          minHeight: 21,
          lineHeight: "21px",
        },
      },
      ...spans
    );
  });

  // Title bar (tab)
  const titleBar = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#252526",
        borderBottom: "1px solid #3e3e42",
        height: 35,
        paddingLeft: 16,
        paddingRight: 16,
        gap: 8,
      },
    },
    React.createElement(
      "span",
      { style: { color: "#e5c07b", fontSize: 13, fontFamily: "monospace" } },
      fileName
    ),
    React.createElement("span", {
      style: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: "#f14c4c",
        marginLeft: 6,
      },
    })
  );

  // Window chrome top bar
  const windowBar = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#3c3c3c",
        height: 30,
        paddingLeft: 12,
        gap: 8,
      },
    },
    React.createElement("span", {
      style: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#ff5f57",
      },
    }),
    React.createElement("span", {
      style: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#febc2e",
      },
    }),
    React.createElement("span", {
      style: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: "#28c840",
      },
    }),
    React.createElement(
      "span",
      {
        style: {
          color: "#cccccc",
          fontSize: 12,
          fontFamily: "monospace",
          marginLeft: 20,
        },
      },
      `${fileName} - Microsoft Visual Studio`
    )
  );

  // Line numbers + code area side by side
  const editorBody = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
        backgroundColor: "#1e1e1e",
        padding: "12px 0",
        overflow: "hidden",
      },
    },
    // Line numbers gutter
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#1e1e1e",
          borderRight: "1px solid #3e3e42",
          paddingRight: 8,
          paddingLeft: 8,
        },
      },
      ...lineNumbers
    ),
    // Code content
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "column",
          paddingLeft: 16,
          flex: 1,
        },
      },
      ...codeLines
    )
  );

  // Status bar
  const statusBar = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        backgroundColor: "#007acc",
        color: "#ffffff",
        padding: "3px 12px",
        fontSize: 12,
        fontFamily: "monospace",
      },
    },
    React.createElement("span", null, "✓  Ready"),
    React.createElement("span", null, "C#"),
    React.createElement("span", null, "UTF-8"),
    React.createElement("span", null, "Ln 1, Col 1")
  );

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#1e1e1e",
        color: "#d4d4d4",
        width: 1200,
        height: 650,
        fontFamily: "monospace",
        overflow: "hidden",
      },
    },
    windowBar,
    titleBar,
    editorBody,
    statusBar
  );
}
