import * as React from "react";
import refractor, { HastToken } from "refractor/core.js";
import rehype from "rehype";

/**
 * The functions mapChild and mapWithDepth based on react-refractor
 * https://github.com/rexxars/react-refractor
 */
const mapChild = (
  child: HastToken,
  i: number,
  depth: number
): React.DOMElement<any, Element> | string => {
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
};

const mapWithDepth = (depth: number) => {
  return function mapChildrenWithDepth(child: HastToken, i: number) {
    return mapChild(child, i, depth);
  };
};

const getHast = (code: string, lang: string): HastToken[] | null => {
  if (!refractor.registered(lang)) {
    try {
      refractor.register(require(`refractor/lang/${lang}.js`));
    } catch (ex) {}
  }
  if (refractor.registered(lang)) {
    return refractor.highlight(code, lang);
  }
  return null;
};

export const getHighlightedHTML = (code: string, lang: string): string => {
  const ast = getHast(code, lang);
  if (ast) {
    return rehype()
      .stringify({ type: "root", children: ast })
      .toString();
  }
  return code;
};

export const getHighlightedCode = (code: string, lang: string) => {
  const ast = getHast(code, lang);
  if (ast) {
    return ast.map(mapWithDepth(0));
  }
  return code;
};
