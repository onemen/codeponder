import { useContext, useRef, useState, useEffect } from "react";
import { css, CodeCard } from "@codeponder/ui";
import { CommentProps, Comments } from "./commentUI";

import {
  FindCodeReviewQuestionsComponent,
  FindCodeReviewQuestionsQuery,
  CodeReviewQuestionInfoFragment,
  QuestionReplyInfoFragment,
} from "./apollo-components";
import { getHighlightedCode } from "../utils/highlightCode";
import { RenderLine } from "./CodeLine";
import { CodeFileContext } from "./CodeFileContext";

interface loadingCodeState {
  pending: boolean;
  resolved?: string[];
}

/*
 * *Styles for the line numbers coming from the server
 *
 */
const SelectLines = (prop: CodeReviewQuestionInfoFragment[]) => {
  let offset = 0;
  const styles = prop.reduce((total, current) => {
    const { startingLineNum, endingLineNum, numReplies } = current;
    total += `
     & .token-line:nth-child(n+${startingLineNum +
       offset}):nth-child(-n+${endingLineNum + offset}) {
      background: hsla(24, 20%, 50%,.08);
      background: linear-gradient(to right, hsla(24, 20%, 50%,.1) 70%, hsla(24, 20%, 50%,0));
    }
     `;
    offset += numReplies + 1;
    return total;
  }, "");
  return css`
    ${styles}
  `;
};

const getCommentsForFile = (
  prop: FindCodeReviewQuestionsQuery,
  owner: string
): Comments => {
  const comment = ({
    id,
    text,
    creator,
    __typename,
  }:
    | CodeReviewQuestionInfoFragment
    | QuestionReplyInfoFragment): CommentProps => ({
    id,
    text,
    username: creator.username,
    isOwner: creator.username == owner,
    type: (__typename || "").includes("Reply") ? "reply" : "question",
  });

  return prop.findCodeReviewQuestions.reduce((comments: Comments, props) => {
    const startingLineNum = props.startingLineNum;
    const endingLineNum = props.endingLineNum;
    const key = endingLineNum;
    comments[key] = comments[key] || [];
    comments[key].push({
      startingLineNum,
      endingLineNum,
      ...comment(props),
    });
    props.replies.forEach(reply => comments[key].push(comment(reply)));
    return comments;
  }, {});
};

const toggleClassForList = (parent: Element, selector: string): void => {
  parent
    .querySelectorAll(`.${selector}`)
    .forEach(elm => elm.classList.toggle(selector, false));
};

const setIsHovered = (
  questions: CodeReviewQuestionInfoFragment[],
  { target: elm, currentTarget: parent, type }: any
) => {
  // let the comment form handle the event
  if (parent.classList.contains("js-select-line")) {
    return;
  }
  // console.log("CodeFile setIsHovered");
  while (elm && elm != parent && !elm.classList.contains("token-line")) {
    elm = elm.parentNode || null;
  }
  if (elm && parent) {
    let isOverLine =
      type == "mouseover" && elm.classList.contains("token-line");

    let numberElm = elm.childNodes[0];
    const currentLine = +numberElm.dataset.lineNumber;
    // we only allow one question on lines range
    if (isOverLine && questions.length > 0) {
      isOverLine = !questions.some(
        q => currentLine >= q.startingLineNum && currentLine <= q.endingLineNum
      );
    }

    if (parent.classList.contains("js-select-line")) {
      if (isOverLine) {
        const selectedRange: string = parent.dataset.selectedRange;
        const [start, end] = selectedRange.split("-").map(val => +val);
        if (currentLine != start && currentLine <= end) {
          toggleClassForList(parent, "is-selected");
          parent.setStartingLineNum(currentLine);
          parent.setAttribute("data-selected-range", `${currentLine}-${end}`);
          while (numberElm && +numberElm.dataset.lineNumber <= end) {
            numberElm.parentNode.classList.add("is-selected");
            numberElm = numberElm.parentNode.nextSibling.childNodes[0];
          }
        }
      }
    } else {
      toggleClassForList(parent, "is-hovered");
      if (isOverLine) {
        elm.classList.add("is-hovered");
      }
    }
  }
};

const PLUSBUTTON = `<button variant="primary" class="btn-open-edit hidden">
    <svg viewBox="0 0 12 16" version="1.1" width="12" height="16"
      aria-hidden="true" preserveAspectRatio="xMaxYMax meet">
      <path fill-rule="evenodd" d="M12 9H7v5H5V9H0V7h5V2h2v5h5v2z"></path>
    </svg>
  </button>`;

const useHighlight = (lang: string, code: string) => {
  const hasLoadedLanguage = useRef(false);
  const [highlightCode, setHighlightCode] = useState<loadingCodeState>({
    pending: true,
  });

  useEffect(() => {
    if (!hasLoadedLanguage.current) {
      getHighlightedCode(code, lang).then(highlightedCode => {
        hasLoadedLanguage.current = true;
        const PlusButton = PLUSBUTTON.split("\n")
          .map(item => item.trim())
          .join("");
        const tokens = highlightedCode.split("\n").map(line => {
          return `${PlusButton}${line}`;
        });

        setHighlightCode({ pending: false, resolved: tokens });
      });
    }
  }, []);
  return highlightCode;
};

export const CodeFile: React.FC = () => {
  const { code, lang, owner, path, postId } = useContext(CodeFileContext);
  const highlightCode = useHighlight(lang, code || "");
  const variables = {
    path,
    postId,
  };

  return (
    <FindCodeReviewQuestionsComponent variables={variables}>
      {({ data, loading }) => {
        if (!data || loading || highlightCode.pending) {
          return null;
        }

        const highlightedCode = highlightCode.resolved!;
        const comments = getCommentsForFile(data, owner);
        const questions = data.findCodeReviewQuestions;

        const onMouseOverAndOut = setIsHovered.bind(null, questions);

        return (
          <CodeCard
            lang={lang}
            selectedLines={SelectLines(questions)}
            onMouseOut={onMouseOverAndOut}
            onMouseOver={onMouseOverAndOut}
          >
            {highlightedCode.map((line, index) => (
              <RenderLine
                key={index}
                comments={comments[index + 1]}
                line={line}
                lineNum={index + 1}
              />
            ))}
          </CodeCard>
        );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};
