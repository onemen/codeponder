import { CodeCard, css } from "@codeponder/ui";
import { useContext } from "react";
import { PrismAsync as SyntaxHighlighter } from "react-syntax-highlighter";
import { coy } from "react-syntax-highlighter/dist/styles/prism";
import {
  CodeReviewQuestionInfoFragment,
  FindCodeReviewQuestionsComponent,
} from "../../../../generated/apollo-components";
import { PostContext } from ".././PostContext";
import { RenderLine } from "./CodeLine";

/*
 * *Styles for the line numbers coming from the server
 *
 */
const selectLines = (prop: CodeReviewQuestionInfoFragment[]) => {
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

export const CodeFile: React.FC = () => {
  const { code, lang, path, postId } = useContext(PostContext);

  return (
    <FindCodeReviewQuestionsComponent
      variables={{
        path,
        postId,
      }}
    >
      {({ data, loading }) => {
        if (!data || loading) {
          return null;
        }

        const questionMap: Record<string, CodeReviewQuestionInfoFragment> = {};

        data.findCodeReviewQuestions.map(q => {
          if (q.lineNum) {
            questionMap[q.lineNum] = q;
          }
        });

        return (
          <SyntaxHighlighter
            PreTag={CodeCard}
            CodeTag="div"
            style={coy}
            wrapLines="true"
            language={lang}
            renderer={renderer(questionMap)}
            selectedLines={selectLines(data.findCodeReviewQuestions)}
          >
            {code || ""}
          </SyntaxHighlighter>
        );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};

const renderer = (
  questionMap: Record<string, CodeReviewQuestionInfoFragment>
) => {
  return ({ rows, stylesheet, useInlineStyles }: any) => {
    rows.pop();
    return rows.map((line: any, index: any) => {
      return (
        <RenderLine
          key={index}
          question={questionMap[index + 1]}
          line={line}
          lineNum={index + 1}
          stylesheet={stylesheet}
          useInlineStyles={useInlineStyles}
        />
      );
    });
  };
};
