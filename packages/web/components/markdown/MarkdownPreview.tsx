import parse from "html-react-parser";
import * as React from "react";
import ReactMarkdown, { ReactMarkdownProps } from "react-markdown";
import {
  getHighlightedCodeSync,
  loadLanguageList,
} from "../../utils/highlightCode";
import "./github-markdown.css";

// load language for each section in the text that starts with: ```LANG
export const loadLanguagesForMarkdown = (text: string) => {
  if (!text) return Promise.resolve();
  const re = /\`\`\`(\w+)\n/g;
  const codeBlocksLanguage = new Set(text.match(re));
  const list = [...codeBlocksLanguage.keys()].map(lang =>
    lang.replace(re, "$1")
  );

  return Promise.all(loadLanguageList(list));
};

// from react-markdown
function getCoreProps(props: any) {
  return props["data-sourcepos"]
    ? { "data-sourcepos": props["data-sourcepos"] }
    : {};
}

const CodeBlockComponent = (props: any) => {
  const { language, value } = props as { language: string; value: string };
  const highlightCode = language
    ? getHighlightedCodeSync(value, language)
    : value;
  const code = React.createElement("code", null, parse(highlightCode));
  return React.createElement("pre", getCoreProps(props), code);
};

export const MarkdownPreview: React.FC<ReactMarkdownProps> = props => (
  <ReactMarkdown {...props} renderers={{ code: CodeBlockComponent }} />
);
