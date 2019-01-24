import Prism, { LanguageDefinition } from "prismjs/components/prism-core";
import { nameToLang } from "./filenameToLang";

const langDepMap: { [key: string]: string | string[] } = {
  javascript: "clike",
  actionscript: "javascript",
  arduino: "cpp",
  aspnet: ["markup", "csharp"],
  bison: "c",
  c: "clike",
  csharp: "clike",
  cpp: "c",
  coffeescript: "javascript",
  crystal: "ruby",
  "css-extras": "css",
  d: "clike",
  dart: "clike",
  django: "markup",
  erb: ["ruby", "markup-templating"],
  fsharp: "clike",
  flow: "javascript",
  glsl: "clike",
  go: "clike",
  groovy: "clike",
  haml: "ruby",
  handlebars: "markup-templating",
  haxe: "clike",
  java: "clike",
  jolie: "clike",
  kotlin: "clike",
  less: "css",
  markdown: "markup",
  "markup-templating": "markup",
  n4js: "javascript",
  nginx: "clike",
  objectivec: "c",
  opencl: "cpp",
  parser: "markup",
  php: ["clike", "markup-templating"],
  "php-extras": "php",
  plsql: "sql",
  processing: "clike",
  protobuf: "clike",
  pug: "javascript",
  qore: "clike",
  jsx: ["markup", "javascript"],
  tsx: ["jsx", "typescript"],
  reason: "clike",
  ruby: "clike",
  sass: "css",
  scss: "css",
  scala: "java",
  smarty: "markup-templating",
  soy: "markup-templating",
  swift: "clike",
  tap: "yaml",
  textile: "markup",
  tt2: ["clike", "markup-templating"],
  twig: "markup",
  typescript: "javascript",
  vbnet: "basic",
  velocity: "markup",
  wiki: "markup",
  xeora: "markup",
  xquery: "markup",
};

export const loadLanguageList = (list: string[]) => {
  return list
    .map(nameToLang)
    .filter(lang => !Prism.languages[lang])
    .map(lang => loadLanguage(lang).catch(e => e));
};

const loadLanguage = async (lang: string) => {
  const deps = langDepMap[lang];
  if (deps) {
    if (typeof deps === "string") {
      await loadLanguage(deps);
    } else {
      await Promise.all(deps.map(loadLanguage));
    }
  }

  // not sure if needed
  // see prismjs/components/index.js
  delete require.cache[require.resolve(`prismjs/components/prism-${lang}.min`)];
  delete Prism.languages[lang];

  return import(`prismjs/components/prism-${lang}.min`);
};

const loadLanguageForGrammar = async (lang: string) => {
  // check if the language has already been loaded
  let grammar = Prism.languages[lang];
  if (grammar === undefined) {
    try {
      await loadLanguage(lang);
    } catch {}
    grammar = Prism.languages[lang];
  }
  return grammar;
};

export const getHighlightedCodeSync = (
  code: string,
  lang: string,
  grammar: LanguageDefinition = Prism.languages[lang]
) => {
  const mixedTokens =
    grammar !== undefined ? Prism.tokenize(code, grammar) : [code];

  const encoded = Prism.util.encode(mixedTokens);
  return Prism.Token.stringify(
    encoded,
    lang as Prism.LanguageDefinition,
    {} as HTMLPreElement
  );
};

export const getHighlightedCode = async (code: string, lang: string) => {
  const grammar = await loadLanguageForGrammar(lang);
  return getHighlightedCodeSync(code, lang, grammar);
};
