import * as React from "react";
import ReactMarkdown, { ReactMarkdownProps } from "react-markdown";
import { getHighlightedCode } from "../../../../utils/highlightCode";
import "./github-markdown.css";

// from react-markdown
function getCoreProps(props: any) {
  return props["data-sourcepos"]
    ? { "data-sourcepos": props["data-sourcepos"] }
    : {};
}

interface highlightProps {
  language: string;
  value: string;
}

const CodeBlockComponent = (props: any) => {
  const { language, value } = props as highlightProps;
  const children = getHighlightedCode(value, language);
  const code = React.createElement("code", null, children);
  return React.createElement("pre", getCoreProps(props), code);
};

export const MarkdownPreview: React.FC<ReactMarkdownProps> = props => (
  <ReactMarkdown {...props} renderers={{ code: CodeBlockComponent }} />
);
