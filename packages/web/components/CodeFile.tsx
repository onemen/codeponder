import { useRef, useState, useEffect } from "react";
import * as Prism from "prismjs";
//import "prismjs/themes/prism.css";
import "prismjs/themes/prism-coy.css";

import styled, { css } from "styled-components";
import Highlight, { defaultProps, Language } from "prism-react-renderer";
//import theme from "prism-react-renderer/themes/vsDarkPlus";

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
      background-color: #ffffcc;
    }
     `);
  }, "");

  return css`
    ${styles}
  `;
};

interface HighlightProps {
  code: string | null;
  lang: Language;
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
    text-align: left;
    margin: 4em 0;
    padding: 0.5em;

    & .token-line {
      line-height: 1.3em;
      height: 1.3em;
    }

    & .token-line:nth-child(odd) {
      background: #f3faff;
    }

    ${SelectLines(data)};
  `;

  const LineNo = styled.span`
    display: inline-block;
    width: 2em;
    user-select: none;
    opacity: 0.3;
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
          {tokens.map((line, i) => (
            <div {...getLineProps({ line, key: i })}>
              <LineNo>{i + 1}</LineNo>
              {line.map((token, key) => {
                return <span {...getTokenProps({ token, key })} />;
              })}
            </div>
          ))}
        </Pre>
      )}
    </Highlight>
  );
};

export const CodeFile: React.SFC<Props> = ({ code, path, postId }) => {
  // const lang: Language = path ? filenameToLang(path) : "";
  const lang: Language = path ? filenameToLang(path) : "";
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
            <HighlightCode code={code} lang={lang} data={data} />
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
