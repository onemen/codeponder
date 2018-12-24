import { useRef, useState, useEffect } from "react";
import * as Prism from "prismjs";
import "prismjs/themes/prism.css";
import "prismjs/themes/prism-coy.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import "prismjs/plugins/line-highlight/prism-line-highlight.css";
import "prismjs/plugins/line-highlight/prism-line-highlight.js";

import styled from "styled-components";
import Highlight, { defaultProps } from "prism-react-renderer";

import { FindCodeReviewQuestionsComponent } from "./apollo-components";
import { filenameToLang } from "../utils/filenameToLang";
import { loadLanguage } from "../utils/loadLanguage";
import { QuestionSection } from "./QuestionSection";

interface Props {
  code: string | null;
  path?: string;
  postId: string;
}

interface HighlightProps {
  code: string | null;
  lang: string;
}

//XXX try to use prism with hooks

const HighlightCode: React.SFC<HighlightProps> = ({ code, lang }) => {
  const hasLoadedLanguage = useRef(false);
  const [tokens, setTokens] = useState([]);

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
        })
        .catch();
    }
  });

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

  const LineNo = styled.span`
    border-right: 1px solid rgba(0, 0, 0, 0.9);
    display: inline-block;
    margin-right: 0.65em;
    width: 2em;
    user-select: none;
    opacity: 0.5;
    padding-left: 0.65em;
  `;

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
                        j,
                      });
                      const tokenProp = { className, children, key };
                      console.log(i, tokenProp);
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
            <HighlightCode code={code} lang={lang} />
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
