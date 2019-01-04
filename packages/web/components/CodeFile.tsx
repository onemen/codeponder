import { useRef, useState, useEffect } from "react";
import "prismjs/themes/prism-coy.css";
import { styled, css, SimpleInterpolation } from "@codeponder/ui";
import { CommentProps, Comments } from "./commentUI";

import {
  FindCodeReviewQuestionsComponent,
  FindCodeReviewQuestionsQuery,
  CodeReviewQuestionInfoFragment,
  QuestionReplyInfoFragment,
} from "./apollo-components";
import { filenameToLang } from "../utils/filenameToLang";
import { getHighlightedCode } from "../utils/highlightCode";
import { CommentsForRow } from "./CommentsForRow";

interface Props {
  owner: string;
  code: string | null;
  path?: string;
  postId: string;
}

interface loadingCodeState {
  pending: boolean;
  resolved?: string[];
}

/*
 * *Styles for the line numbers coming from the server
 *
 * TODO: Perhaps refactor SelectLinesMouse as a 'sub function' of SelectLines?
 * Or the two in a more general utils?
 */
const SelectLines = (prop: FindCodeReviewQuestionsQuery) => {
  let offset = 0;
  const styles = prop.findCodeReviewQuestions.reduce((total, current) => {
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

const setIsHovered = (
  { target: elm, currentTarget: current }: any,
  showButton: boolean
) => {
  while (elm && elm != current && !elm.classList.contains("token-line")) {
    // hide the button when user hover over commets or line-number
    const name = elm.classList[0];
    if (name && name.match(/CommentBoxContainer|line-number/)) {
      showButton = false;
    }
    elm = elm.parentNode || null;
  }
  if (elm && current) {
    current
      .querySelectorAll(".is-hovered")
      .forEach((button: HTMLButtonElement) =>
        button.classList.toggle("is-hovered", false)
      );
    if (showButton) {
      elm.childNodes[1].classList.add("is-hovered");
    }
  }
};

// TODO : move to ui, check if i can move also the import "prismjs/themes/prism-coy.css";
const Pre = styled.pre`
  & code[class*="language-"] {
    padding-left: 0;
    overflow: hidden;
  }

  & .line-number {
    border-right: 1px solid #999;
    color: #999;
    cursor: pointer;
    display: inline-block;
    letter-spacing: -1px;
    margin-right: 0.65em;
    padding-right: 0.8em;
    text-align: right;
    user-select: none;
    width: 3em;

    &.comment {
      cursor: default;
    }
  }

  & .btn-open-edit {
    appearance: none;
    border: none;
    text-align: center;
    text-transform: uppercase;
    font-weight: 500;
    cursor: pointer;

    /* primary */
    background-color: #6dc1fd;
    color: #ffffff;
    font-size: 1.4rem;
    padding: 0.8rem 1rem;
    text-transform: uppercase;
    border-radius: 0.4rem;

    margin: -2px 0px -2px -20px;
    padding: 0;
    width: 22px;
    height: 22px;
    transform: scale(0.8);
    transition: transform 0.1s ease-in-out;

    &.hidden {
      opacity: 0;
    }

    &:hover {
      transform: scale(1);
      opacity: 1;
    }

    &.is-hovered {
      opacity: 1;
    }

    & svg {
      display: inline-block;
      fill: currentColor;
      vertical-align: text-top;
      pointer-events: none;
    }
  }

  ${(p: { selectedLines: SimpleInterpolation }) => p.selectedLines}
`;

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
        const tokens = highlightedCode.split("\n").map((line, rowNum) => {
          return `<span class="line-number">${rowNum +
            1}</span>${PlusButton}${line}`;
        });

        setHighlightCode({ pending: false, resolved: tokens });
      });
    }
  }, []);
  return highlightCode;
};

export const CodeFile: React.FC<Props> = ({ code, path, postId, owner }) => {
  const lang = path ? filenameToLang(path) : "";
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

        return (
          <Pre className={`language-${lang}`} selectedLines={SelectLines(data)}>
            <code
              className={`code-content language-${lang}`}
              onMouseOut={(e: any): void => {
                setIsHovered(e, false);
              }}
              onMouseOver={(e: any): void => {
                setIsHovered(e, true);
              }}
            >
              {highlightedCode.map((line, index) => (
                <CommentsForRow
                  key={index}
                  code={code || ""}
                  comments={comments[index + 1]}
                  lang={lang}
                  line={line}
                  owner={owner}
                  rowNum={index + 1}
                  {...variables}
                />
              ))}
            </code>
          </Pre>
        );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};
