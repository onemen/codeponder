import React, { useContext, useRef, useState, useEffect } from "react";
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
 * TODO: Perhaps refactor SelectLinesMouse as a 'sub function' of SelectLines?
 * Or the two in a more general utils?
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

const setIsHovered = ({ target: elm, currentTarget: current, type }: any) => {
  let showButton = type == "mouseover";
  while (elm && elm != current && !elm.classList.contains("token-line")) {
    // hide the button when user hover over comments or line-number
    const name = elm.classList[0];
    if (name && name.match(/CommentBoxContainer|line-number|code-content/)) {
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
        const tokens = highlightedCode.split("\n").map((line, lineNum) => {
          return `<span class="line-number">${lineNum +
            1}</span>${PlusButton}${line}`;
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

  const [startTime] = useState(Date.now());
  useEffect(() => {
    console.log(
      "time",
      highlightCode.pending ? "lang pending" : "lang resolved",
      Date.now() - startTime
    );
  });

  return (
    <FindCodeReviewQuestionsComponent variables={variables}>
      {({ data, loading }) => {
        if (!data || loading || highlightCode.pending) {
          return null;
        }

        const highlightedCode = highlightCode.resolved!;
        const comments = getCommentsForFile(data, owner);

        return (
          // <CodeCard
          //   lang={lang}
          //   selectedLines={SelectLines(data.findCodeReviewQuestions)}
          //   onMouseOut={setIsHovered}
          //   onMouseOver={setIsHovered}
          // >
          //   {highlightedCode.map((line, index) => (
          //     <RenderLine
          //       key={index}
          //       comments={comments[index + 1]}
          //       line={line}
          //       lineNum={index + 1}
          //     />
          //   ))}
          // </CodeCard>
          <CodeCard
            lang={lang}
            selectedLines={SelectLines(data.findCodeReviewQuestions)}
            onMouseOut={setIsHovered}
            onMouseOver={setIsHovered}
          >
            <RenderCode comments={comments} highlightedCode={highlightedCode} />
          </CodeCard>
        );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};

interface RenderCodeProps {
  comments: Comments;
  highlightedCode: string[];
}

// interface AddLinesProps {
//   list: string[];
//   setList: React.Dispatch<React.SetStateAction<string[]>>;
//   highlightedCode: string[];
// }

type setFunction = React.Dispatch<React.SetStateAction<string[]>>;

const addLinesAnim = (
  list: string[],
  setList: setFunction,
  highlightedCode: string[]
) => {
  return {
    requestHandle: 0,
    start: function() {
      if (!this.requestHandle && list.length < highlightedCode.length) {
        this.requestHandle = window.requestAnimationFrame(
          this.sample.bind(this)
        );
      }
    },
    stop: function() {
      window.cancelAnimationFrame(this.requestHandle);
      this.requestHandle = 0;
    },
    sample: function() {
      if (list.length < highlightedCode.length) {
        const amount = Math.min(
          list.length + NUMBER_OF_LINE_TO_RENDER,
          highlightedCode.length
        );
        const newList = highlightedCode.slice(0, amount);
        console.log("newList", newList.length);
        setList(newList);
        this.requestHandle = window.requestAnimationFrame(
          this.sample.bind(this)
        );
      }
    },
  };
};

export const RenderCode = React.memo(
  ({ comments, highlightedCode }: RenderCodeProps) => {
    const divRef = useRef<HTMLDivElement>(null);
    console.log("RenderCode");
    // useEffect(() => {
    //   const start = Date.now();
    //   const addLines = (items: string[]) => {
    //     for (let index = 0; index < items.length; index++) {
    //       const elm = document.createElement("div");
    //       // elm.textContent = `line ${index + 1}`;
    //       elm.innerHTML = items[index];
    //       divRef.current!.appendChild(elm);
    //     }
    //   };
    //   console.log("total time", Date.now() - start);

    //   let requestHandle: number;
    //   function request() {
    //     const currentLength = divRef.current!.childNodes.length;
    //     if (currentLength < highlightedCode.length) {
    //       const amount = Math.min(
    //         currentLength + NUMBER_OF_LINE_TO_RENDER,
    //         highlightedCode.length
    //       );
    //       const newList = highlightedCode.slice(currentLength, amount);
    //       console.log("newList", newList.length);
    //       addLines(newList);
    //       window.requestAnimationFrame(() => {
    //         requestHandle = window.requestAnimationFrame(request);
    //       });
    //     }
    //   }
    //   requestHandle = window.requestAnimationFrame(request);
    //   return () => {
    //     window.cancelAnimationFrame(requestHandle);
    //     requestHandle = 0;
    //   };
    // }, []);

    useEffect(() => {
      const elm = document.createElement("div");
      // elm.textContent = `line ${index + 1}`;
      elm.innerHTML = highlightedCode.join("\n");
      divRef.current!.appendChild(elm);
    }, []);

    return <div ref={divRef} />;
  }
);

const NUMBER_OF_LINE_TO_RENDER = 1000;
export const RenderCode1 = React.memo(
  ({ comments, highlightedCode }: RenderCodeProps) => {
    const [list, setList] = useState(highlightedCode.slice(0, 200));

    useEffect(() => {
      // const linesAnim = addLinesAnim(list, setList, highlightedCode);
      // linesAnim.start();
      // return () => {
      //   linesAnim.stop();
      // };
      let requestHandle: number;
      function request() {
        if (list.length < highlightedCode.length) {
          const amount = Math.min(
            list.length + NUMBER_OF_LINE_TO_RENDER,
            highlightedCode.length
          );
          const newList = highlightedCode.slice(0, amount);
          console.log("newList", newList.length);
          setList(newList);
          // requestHandle = window.requestAnimationFrame(request);
        }
      }
      requestHandle = window.requestAnimationFrame(request);
      return () => {
        window.cancelAnimationFrame(requestHandle);
        requestHandle = 0;
      };

      // const timer = setTimeout(() => {
      //   if (list.length < highlightedCode.length) {
      //     const amount = Math.min(
      //       list.length + NUMBER_OF_LINE_TO_RENDER,
      //       highlightedCode.length
      //     );
      //     setList(highlightedCode.slice(0, amount));
      //   }
      // });
      // return () => {
      //   clearTimeout(timer);
      // };

      // let deferred: any = {};
      // new Promise(resolve => {
      //   deferred.resolve = resolve;
      //   if (list.length < highlightedCode.length) {
      //     const amount = Math.min(
      //       list.length + NUMBER_OF_LINE_TO_RENDER,
      //       highlightedCode.length
      //     );
      //     setList(highlightedCode.slice(0, amount));
      //   }
      //   resolve();
      // });
      // return () => {
      //   deferred.resolve();
      //   deferred = null;
      // };
    });

    return (
      <>
        {list.map((line, index) => (
          <RenderLine
            key={index}
            comments={comments[index + 1]}
            line={line}
            lineNum={index + 1}
          />
        ))}
      </>
    );
  }
);
