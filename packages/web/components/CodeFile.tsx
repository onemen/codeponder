import React, { useRef, useState, useEffect } from "react";
import * as Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/themes/prism-coy.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-highlight/prism-line-highlight.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.js";
import "./highlight.css";

import styled from "styled-components";
import Highlight, { defaultProps } from "prism-react-renderer";

import { FindCodeReviewQuestionsComponent } from "./apollo-components";
import { filenameToLang } from "../utils/filenameToLang";
import { loadLanguage } from "../utils/loadLanguage";
import { QuestionSection } from "./QuestionSection";
import { array } from "yup";

interface Props {
  code: string | null;
  path?: string;
  postId: string;
}

interface HighlightProps {
  code: string | null;
  lang: string;
  dataLines: string[];
}

//XXX try to use prism with hooks
function isLineSelected(line: number, ranges: string[]): boolean {
  return ranges.some(range => {
    if (range.includes("-")) {
      const rangeArr = range.split("-");
      // console.log(
      //   line,
      //   range,
      //   rangeArr,
      //   Number(rangeArr[0]),
      //   Number(rangeArr[1]),
      //   " test 1 " +
      //     Number(rangeArr[0]) +
      //     " >=" +
      //     line +
      //     " " +
      //     (Number(rangeArr[0]) >= line),
      //   " test 2 " +
      //     line +
      //     " <=" +
      //     Number(rangeArr[1]) +
      //     " " +
      //     (line <= Number(rangeArr[1])),
      //   " test " + (Number(rangeArr[0]) >= line && line <= Number(rangeArr[1]))
      // );
      return line >= Number(rangeArr[0]) && line <= Number(rangeArr[1]);
    }

    return Number(range) == line;
  });
}

const HighlightCode: React.SFC<HighlightProps> = ({
  code,
  lang,
  dataLines,
}) => {
  const hasLoadedLanguage = useRef(false);
  // const [tokens, setTokens] = useState([]);
  const [highlightedCode, setHighlightedCode] = useState("");

  // Prism.hooks.add("after-tokenize", args => {
  //   console.log("after-tokenize", { ...args });
  //   setTokens(args.tokens);
  // });
  //   Prism.highlight(
  //     code || "",
  //     Prism.languages[lang],
  //     lang || undefined
  //   );

  const LineNo = `
    border-right: 1px solid rgba(0, 0, 0, 0.9);
    display: inline-block;
    margin-right: 0.65em;
    user-select: none;
    // opacity: 0.5;
    // padding: 0 0.7em;
    color: #999;
    padding-right: 0.8em;
    text-align: right;
  `;

  // const LineNo = "border-right: 1px solid rgba(0, 0, 0, 0.9);display: inline-block;margin-right: 0.65em;width: 2em; opacity: 0.5;padding-left: 0.65em";

  function setTokens(tokens: any) {
    console.log(tokens);
  }

  useEffect(() => {
    // if (!hasLoadedLanguage.current) {
    //   loadLanguage(lang)
    //     .then(() => {
    //       // Prism.hooks.all = {}
    //       Prism.hooks.add("after-tokenize", args => {
    //         console.log("after-tokenize", { ...args });
    //         setTokens(args.tokens);
    //       });
    //       // Prism.highlight(code || "", Prism.languages[lang], lang);

    //       const grammar = Prism.languages[lang];
    //       const mixedTokens =
    //         grammar !== undefined
    //           ? Prism.tokenize(code, grammar, lang)
    //           : [code];
    //       const tokens = normalizeTokens(mixedTokens);

    //       hasLoadedLanguage.current = true;
    //     })
    //     .catch();
    // }
    // return () => {
    //   Prism.hooks.all = {};
    // };
    if (!hasLoadedLanguage.current) {
      loadLanguage(lang)
        .then(() => {
          hasLoadedLanguage.current = true;

          console.log("hook wrap exist", Prism.hooks.all["wrap"]);

          // Prism.hooks.add("wrap", args => {
          //   console.log("wrap", { ...args });
          //   setTokens(args.tokens);
          // });

          let innerHTML = Prism.highlight(
            code || "",
            Prism.languages[lang],
            lang || undefined
          ).split("\n");
          const width = Math.max(String(innerHTML.length).length, 2);
          console.log("selected dataLines", dataLines);
          innerHTML = innerHTML
            .map((line: string, i: number) => {
              // console.log(
              //   "isLineSelected",
              //   i + 1,
              //   isLineSelected(i + 1, dataLines)
              // );
              const selected = isLineSelected(i + 1, dataLines)
                ? `background: red;`
                : // ? `background: linear-gradient(to right, hsla(24, 20%, 50%,.1) 70%, hsla(24, 20%, 50%,0))`
                  "";

              return `<span class="token-line" style="${selected}"><span style="${LineNo}width:${width}em;">${i +
                1}</span>${line}</span>`;
            })
            .join("\n");
          setHighlightedCode(innerHTML);
        })
        .catch();
    }
  });

  return (
    <pre className={`language-${lang}`} data-lines={dataLines.join(" ")}>
      <code
        className={`language-${lang}`}
        dangerouslySetInnerHTML={{ __html: highlightedCode }}
      />
    </pre>
  );

  let codeRef = React.createRef();

  // function setHighligh() {
  //   console.log("in setHighligh", { innerHTML });
  //   return { __html: innerHTML };
  // }

  // let innerHTML = "";
  return (
    <pre
      ref={() => {
        // const element = document.createElement("code");
        // element.className = `language-${lang}`;
        // element.textContent = code;
        // Prism.highlightElement(element);
        // innerHTML = element.innerHTML

        innerHTML = Prism.highlight(
          code || "",
          Prism.languages[lang],
          lang || undefined
        )
          .split("\n")
          .map((line: string, i: number) => `<span>${i + 1}</span>${line}`)
          .join("\n");
        console.log("set innerHTML", { innerHTML });
        // dangerouslySetInnerHTML = {{ __html: innerHTML }}
        codeRef.current && codeRef.current.setAttribute("_tmp", innerHTML);
      }}
      className={`language-${lang}`}
    >
      <code ref={codeRef} dangerouslySetInnerHTML={setHighligh(codeRef)} />
    </pre>
  );

  // const highlightedCode = Prism.highlight(
  //   code || "",
  //   Prism.languages[lang],
  //   lang || undefined
  // );

  // const innerHTML = highlightedCode
  //   .split("\n")
  //   .map((line, i) => `<span>${i}</span>${line}`);
  // return (
  //   <pre>
  //     <code className=""></code>
  //   </pre>
  // )

  // return tokens.map((line, i) => {
  //   console.log(i, line);
  //   return (
  //     <div key={i}>
  //       <span>{i + 1}</span>
  //       {/*         {line.map((token, key) => {
  //         return <span key={key}>{token}</span>;
  //       })} */}
  //     </div>
  //   );
  // });

  // const grammar = Prism.languages[lang];
  // console.log({ lang, grammar });

  return (
    <Highlight {...defaultProps} code={code} language={lang}>
      {({
        className: XclassName,
        tokens,
        getLineProps,
        getTokenProps,
        ...props
      }) => {
        console.log({ XclassName, tokens, props });
        return (
          <pre className={`language-${lang}`}>
            <code className={`language-${lang}`}>
              {tokens.map((line, i) => {
                return (
                  <div
                    {...getLineProps({ line, key: i })}
                    style={{ color: "#000" }}
                  >
                    <LineNo>{i + 1}</LineNo>
                    {line.map((token, j) => {
                      const { className, children, key } = getTokenProps({
                        token,
                        key: j,
                      });
                      const tokenProp = { className, children, key };
                      // console.log(i, tokenProp);
                      return <span {...tokenProp} />;
                    })}
                  </div>
                );
              })}
            </code>
          </pre>
        );
      }}
    </Highlight>
  );
};

export const CodeFile: React.SFC<Props> = ({ code, path, postId }) => {
  const hasLoadedLanguage = useRef(false);
  // const [tokens, setTokens] = useState([]);

  const lang = path ? filenameToLang(path) : "";
  const variables = {
    path,
    postId,
  };

  return (
    <FindCodeReviewQuestionsComponent variables={variables}>
      {({ data, loading }) => {
        if (!data || loading) {
          return null;
        }

        const dataLines = data.findCodeReviewQuestions.map(q => {
          return `${q.startingLineNum}-${q.endingLineNum}`;
        });

        return (
          <>
            <pre
              ref={async () => {
                if (!hasLoadedLanguage.current) {
                  try {
                    await loadLanguage(lang);
                  } catch {}
                  //   // Prism.hooks.add("before-insert", function({ ...args }) {
                  //   //   console.log("before-insert", { ...args });
                  //   // });
                  //   // Prism.hooks.add("complete", function({ ...args }) {
                  //   //   console.log("complete", { ...args });
                  //   // });
                  // Prism.highlightAll();
                  const element = document.querySelector("#highlight");
                  if (element) {
                    Prism.highlightElement(element);
                  }
                  //   Prism.hooks.add("after-tokenize", args => {
                  //     console.log("after-tokenize", { ...args });
                  //     setTokens(args.tokens);
                  //   });
                  //   Prism.highlight(
                  //     code || "",
                  //     Prism.languages[lang],
                  //     lang || undefined
                  //   );
                  hasLoadedLanguage.current = true;
                }
              }}
              className="line-numbers"
              data-line={dataLines.join(" ")}
            >
              <code id="highlight" className={`language-${lang}`}>
                {code}
              </code>
              {/*               {tokens.map((line, i) => {
                return (
                  <div key={i}>
                    <span>{i + 1}</span>
                    {line.map((token, key) => {
                      return <span key={key}>{token}</span>;
                    })}
                  </div>
                );
              })} */}
            </pre>
            <HighlightCode code={code} lang={lang} dataLines={dataLines} />
            <QuestionSection
              variables={variables}
              code={code || ""}
              postId={postId}
              programmingLanguage={lang}
              path={path}
            />
          </>
        );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};
