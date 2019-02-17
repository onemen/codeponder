import { CodeCard, css } from "@codeponder/ui";
import * as React from "react";
import { useContext, useEffect, useState } from "react";
import ReactDOMServer from "react-dom/server";
import {
  FindQuestionsComponent,
  QuestionInfoFragment,
} from "../../../../generated/apollo-components";
import { getHighlightedCode } from "../../../../utils/highlightCode";
import { PostContext } from ".././PostContext";
import { RenderLine } from "./CodeLine";

interface LoadingCodeState {
  pending: boolean;
  resolved?: string[];
}

/*
 * *Styles for the line numbers coming from the server
 *
 */
const selectLines = (prop: QuestionInfoFragment[]) => {
  const styles = prop.reduce((total, current) => {
    const { lineNum } = current;
    total += `
     & .token-line:nth-child(n+${lineNum}):nth-child(-n+${lineNum}) {
      background: hsla(24, 20%, 50%,.08);
      background: linear-gradient(to right, hsla(24, 20%, 50%,.1) 70%, hsla(24, 20%, 50%,0));
    }
     `;
    return total;
  }, "");

  return css`
    ${styles}
  `;
};

const PLUSBUTTON = `<button class="btn-open-edit token-btn">+</button>`;

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

const useHighlight = (lang: string, code: string) => {
  const [highlightCode, setHighlightCode] = useState<LoadingCodeState>({
    pending: true,
  });

  useEffect(() => {
    getHighlightedCode(code, lang).then(highlightedCode => {
      const value = highlightedCode.map(mapWithDepth(0));
      console.log("value", highlightedCode.map(mapWithDepth(0)));

      let html = ReactDOMServer.renderToStaticMarkup(
        React.createElement("code", null, value)
      );

      html = html.replace(/^<code>|<\/code>?/, "");

      // const tokens = highlightedCode.split("\n").map(line => {
      const tokens = html.split("\n").map(line => {
        return `${PLUSBUTTON}${line}`;
      });

      setHighlightCode({ pending: false, resolved: tokens });
    });

    return () => {};
  }, []);
  return highlightCode;
};

export const CodeFile: React.FC<{ questionId?: string }> = ({ questionId }) => {
  const { code, lang, path, postId } = useContext(PostContext);
  const highlightCode = useHighlight(lang, code || "");

  return (
    <FindQuestionsComponent
      variables={{
        path,
        postId,
      }}
    >
      {({ data, loading }) => {
        if (!data || loading || highlightCode.pending) {
          return null;
        }

        const questionMap: Record<string, QuestionInfoFragment> = {};

        data.findQuestions.map(q => {
          if (q.lineNum) {
            questionMap[q.lineNum] = q;
          }
        });

        return (
          <CodeCard lang={lang} selectedLines={selectLines(data.findQuestions)}>
            {highlightCode.resolved!.map((line, index) => {
              return (
                <RenderLine
                  key={index}
                  question={questionMap[index + 1]}
                  line={line}
                  lineNum={index + 1}
                  openQuestionId={questionId}
                />
              );
            })}
          </CodeCard>
        );
      }}
    </FindQuestionsComponent>
  );
};
