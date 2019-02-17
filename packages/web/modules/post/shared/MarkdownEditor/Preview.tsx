// import parse from "html-react-parser";
import * as React from "react";
import ReactMarkdown, { ReactMarkdownProps } from "react-markdown";
import refractor from "refractor/core.js";
import { loadLanguageList } from "../../../../utils/highlightCode";
import "./github-markdown.css";

// load language for each section in the text that starts with: ```LANG
export const loadLanguagesForMarkdown = (text: string) => {
  if (!text) return Promise.resolve([]);
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

interface highlightProps {
  language: string;
  value: string;
}

function mapChild(child, i, depth) {
  if (child.tagName) {
    const className =
      child.properties && Array.isArray(child.properties.className)
        ? child.properties.className.join(" ")
        : child.properties.className;

    return React.createElement(
      child.tagName,
      Object.assign({ key: `fract-${depth}-${i}` }, child.properties, {
        className,
      }),
      child.children && child.children.map(mapWithDepth(depth + 1))
    );
  }

  return child.value;
}

function mapWithDepth(depth) {
  return function mapChildrenWithDepth(child, i) {
    return mapChild(child, i, depth);
  };
}

const getHighlightedCode = ({ language, value }: highlightProps) => {
  console.log(language, refractor.registered(language));
  if (!refractor.registered(language)) {
    refractor.register(require(`refractor/lang/${language}.js`));
    console.log(language, refractor.registered(language));
  }

  const ast = refractor.highlight(value, language);
  console.log(ast);

  return ast.map(mapWithDepth(0));
};

const CodeBlockComponent = (props: any) => {
  const { language, value } = props as highlightProps;
  const highlightCode = language ? getHighlightedCode(props) : value;
  // const code = React.createElement("code", null, parse(highlightCode));
  const code = React.createElement("code", null, highlightCode);
  return React.createElement("pre", getCoreProps(props), code);
};

export const MarkdownPreview: React.FC<ReactMarkdownProps> = props => (
  <ReactMarkdown {...props} renderers={{ code: CodeBlockComponent }} />
);
