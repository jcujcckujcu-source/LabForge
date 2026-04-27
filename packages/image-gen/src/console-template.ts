import React from "react";

interface ConsoleTemplateProps {
  outputText: string;
  programPath?: string;
}

/**
 * Builds a Satori-compatible React element tree representing
 * a Windows cmd/PowerShell console window with program output.
 */
export function buildConsoleElement(
  props: ConsoleTemplateProps
): React.ReactElement {
  const { outputText, programPath = "C:\\Users\\Student\\lab" } = props;

  // Split output into lines for rendering
  const lines = outputText.split("\n");

  const outputLines = lines.map((line, i) =>
    React.createElement(
      "div",
      {
        key: `ol-${i}`,
        style: {
          display: "flex",
          color: "#cccccc",
          fontSize: 14,
          fontFamily: "monospace",
          lineHeight: "20px",
          whiteSpace: "pre",
        },
      },
      line || " "
    )
  );

  // Window title bar (Windows style)
  const titleBar = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: "#1f1f1f",
        height: 30,
        paddingLeft: 12,
        paddingRight: 8,
      },
    },
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
        },
      },
      React.createElement(
        "span",
        {
          style: {
            fontSize: 16,
            color: "#cccccc",
          },
        },
        "⬛"
      ),
      React.createElement(
        "span",
        {
          style: {
            color: "#cccccc",
            fontSize: 12,
            fontFamily: "monospace",
          },
        },
        "C:\\Windows\\system32\\cmd.exe"
      )
    ),
    React.createElement(
      "div",
      {
        style: {
          display: "flex",
          flexDirection: "row",
          gap: 0,
        },
      },
      React.createElement(
        "span",
        {
          style: {
            color: "#cccccc",
            fontSize: 12,
            padding: "0 10px",
            fontFamily: "monospace",
          },
        },
        "─"
      ),
      React.createElement(
        "span",
        {
          style: {
            color: "#cccccc",
            fontSize: 12,
            padding: "0 10px",
            fontFamily: "monospace",
          },
        },
        "□"
      ),
      React.createElement(
        "span",
        {
          style: {
            color: "#cccccc",
            fontSize: 12,
            padding: "0 10px",
            fontFamily: "monospace",
          },
        },
        "✕"
      )
    )
  );

  // Prompt line
  const promptLine = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        fontSize: 14,
        fontFamily: "monospace",
        lineHeight: "20px",
        marginBottom: 4,
      },
    },
    React.createElement(
      "span",
      { style: { color: "#4ec9b0" } },
      `${programPath}>`
    ),
    React.createElement(
      "span",
      { style: { color: "#dcdcaa" } },
      " dotnet run"
    )
  );

  // Cursor blink (static)
  const cursorLine = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "row",
        fontSize: 14,
        fontFamily: "monospace",
        lineHeight: "20px",
        marginTop: 4,
      },
    },
    React.createElement(
      "span",
      { style: { color: "#4ec9b0" } },
      `${programPath}>`
    ),
    React.createElement("span", {
      style: {
        display: "flex",
        width: 8,
        height: 16,
        backgroundColor: "#cccccc",
        marginLeft: 4,
        alignSelf: "center",
      },
    })
  );

  // Main console body
  const consoleBody = React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        backgroundColor: "#0c0c0c",
        padding: 16,
        overflow: "hidden",
      },
    },
    promptLine,
    ...outputLines,
    cursorLine
  );

  return React.createElement(
    "div",
    {
      style: {
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0c0c0c",
        width: 900,
        height: 500,
        fontFamily: "monospace",
        overflow: "hidden",
      },
    },
    titleBar,
    consoleBody
  );
}
