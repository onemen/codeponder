import { useRef, useState, useEffect } from "react";
import * as Prism from "prismjs";
import "prismjs/themes/prism-coy.css";

import styled, { css } from "styled-components";
import Highlight, { defaultProps } from "prism-react-renderer";

import {
  FindCodeReviewQuestionsComponent,
  FindCodeReviewQuestionsQuery,
} from "./apollo-components";
import { filenameToLang } from "../utils/filenameToLang";
import { loadLanguage } from "../utils/loadLanguage";
import { QuestionSection } from "./QuestionSection";

interface Props {
  code: string | null;
  path?: string;
  postId: string;
}

const SelectLines = (prop: FindCodeReviewQuestionsQuery) => {
  const styles = prop.findCodeReviewQuestions.reduce((total, current) => {
    return (total += `
     & .token-line:nth-child(n+${current.startingLineNum}):nth-child(-n+${
      current.endingLineNum
    }) {
      background: hsla(24, 20%, 50%,.08);
      background: linear-gradient(to right, hsla(24, 20%, 50%,.1) 70%, hsla(24, 20%, 50%,0));
    }
     `);
  }, "");

  return css`
    ${styles}
  `;
};

interface HighlightProps {
  code: string;
  lang: string;
  data: FindCodeReviewQuestionsQuery;
}

const HighlightCode: React.SFC<HighlightProps> = ({ code, lang, data }) => {
  const hasLoadedLanguage = useRef(false);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    if (!hasLoadedLanguage.current) {
      loadLanguage(lang)
        .then(() => {
          setloading(false);
          hasLoadedLanguage.current = true;
        })
        .catch(() => {});
    }
  }, []);

  if (loading) {
    return null;
  }

  const Pre = styled.pre`
    & code[class*="language-"] {
      padding-left: 0;
    }

    ${SelectLines(data)};
  `;

  const LineNo = styled.span`
    border-right: 1px solid #999;
    display: inline-block;
    color: #999;
    letter-spacing: -1px;
    margin-right: 0.65em;
    padding-right: 0.8em;
    text-align: right;
    user-select: none;
    width: 3em;
  `;

  // Use original Prism.
  // the version included in prism-react-renderer doesn't load all languages
  const props = {
    ...defaultProps,
    Prism,
  };

  return (
    <Highlight {...props} theme={undefined} code={code} language={lang}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => (
        <Pre className={className} style={style}>
          <code className={className}>
            {tokens.map((line, i) => (
              <div {...getLineProps({ line, key: i })}>
                <LineNo>{i + 1}</LineNo>
                {line.map((token, key) => {
                  return <span {...getTokenProps({ token, key })} />;
                })}
              </div>
            ))}
          </code>
        </Pre>
      )}
    </Highlight>
  );
};

export const CodeFile: React.SFC<Props> = ({ code, path, postId }) => {
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

        return (
          <>
            <HighlightCode code={code || ""} lang={lang} data={data} />
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
