import { useRef, useState, useEffect } from "react";
import * as Prism from "prismjs";
import "prismjs/themes/prism-coy.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.css";
import "prismjs/plugins/line-numbers/prism-line-numbers.js";
import Highlight, { Token, RenderProps } from "prism-react-renderer";
import { IconButton, styled, css, SimpleInterpolation } from "@codeponder/ui";
import { CommentProps, Comments, LineNo, CommentBox } from "./commentUI";
import normalizeTokens from "prism-react-renderer/lib/utils/normalizeTokens";

import {
  FindCodeReviewQuestionsComponent,
  FindCodeReviewQuestionsQuery,
  CodeReviewQuestionInfoFragment,
  QuestionReplyInfoFragment,
} from "./apollo-components";
import { filenameToLang } from "../utils/filenameToLang";
import { loadLanguage } from "../utils/loadLanguage";
import { CommentData, AddComment } from "./CommentSection";
import { getScrollY } from "../utils/domScrollUtils";
import { resolve } from "path";

interface Props {
  owner: string;
  code: string | null;
  path?: string;
  postId: string;
}

interface HighlightPreProps extends RenderProps, CommentData {
  data: FindCodeReviewQuestionsQuery;
  owner: string;
}
interface RenderRowProps extends CommentData {
  owner: string;
  line: Token[];
  comments: CommentProps[];
  getLineProps: RenderProps["getLineProps"];
  getTokenProps: RenderProps["getTokenProps"];
  rowNum: number;
}

/*
 * *Styles for the line numbers coming from the server
 *
 * TODO: Perhaps refactor SelectLinesMouse as a 'sub function' of SelectLines?
 * Or the two in a more general utils?
 */
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
  { current }: React.RefObject<HTMLElement>,
  { target: elm }: any,
  showButton: boolean
) => {
  while (elm && elm != current && !elm.classList.contains("token-line")) {
    // hide the button when user hover over commets or line-number
    const name = elm.classList[0];
    if (name && name.match(/CommentBoxContainer|LineNo/)) {
      showButton = false;
    }
    elm = elm.parentNode || null;
  }
  if (elm && current) {
    current
      .querySelectorAll(".is-hovered")
      .forEach(button => button.classList.toggle("is-hovered", false));
    if (showButton) {
      elm.childNodes[1].classList.add("is-hovered");
    }
  }
};

const RenderRow: React.SFC<RenderRowProps> = ({
  line,
  getLineProps,
  getTokenProps,
  rowNum,
  comments,
  owner,
  ...props
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [commentsForRow, setCommentsForRow] = useState(comments || []);

  /*
  use useCallback for onOpenEditor and submitting
  const memoizedCallback = useCallback(
    () => {
      doSomething(a, b);
    },
    [a, b],
  );

  */

  const onOpenEditor = () => {
    setShowEditor(true);
  };

  let submitting = false;
  const onEditorSubmit = async (result: any) => {
    if (result) {
      try {
        const response = await result.response;
        console.log(response);

        const data =
          result.data.type == "question"
            ? response.data.createCodeReviewQuestion.codeReviewQuestion
            : response.data.createQuestionReply.questionReply;

        result.data.username = data.creator.username;
        result.data.isOwner = data.creator.username = owner;
        result.data.id = data.id;
        result.data.__typename = data.__typename;
        submitting = true;
        setCommentsForRow([...commentsForRow, result.data]);
      } catch (ex) {
        console.log("Error when saving form", result.data.type, ex);
      }
    }
    setShowEditor(false);
  };

  useEffect(
    () => {
      submitting = false;
    },
    [showEditor]
  );

  useEffect(() => {
    // prevent page scroll after submiting comment form
    const stopScroll = (event: UIEvent): void => {
      if (submitting) {
        event.preventDefault();
        window.scrollTo(0, getScrollY());
      }
    };
    window.addEventListener("scroll", stopScroll);
    return () => {
      window.removeEventListener("scroll", stopScroll);
    };
  }, []);

  /*
option 1
  move commentsForRow.map to
  AddComment, rename the component CommentSection

  option 2
  creat child component in AddComment and store new comments in
  AddComment, with this approach we dont need to render the row
  only AddComment will render !!!

  option 3
  don't change curret code

  the only reason to do 1 or 2 if it will be faster user exp.

  regarding data we get after motation check if i can update the array after render comment in AddComment component

  */

  // check if it is faster to add code as a child innerhtml
  // is it posible to render only the edit box with react on this page?

  return (
    <div {...getLineProps({ line, key: rowNum })}>
      <LineNo>{rowNum}</LineNo>
      <IconButton
        style={{ margin: "-2px 0px -2px -20px" }}
        variant="primary"
        icon="plus"
        className="hidden"
        onClick={onOpenEditor}
      />
      {line.map((token, key) => (
        <span {...getTokenProps({ token, key })} />
      ))}
      {commentsForRow.map((comment, key) => {
        return <CommentBox {...{ ...comment, key, onOpenEditor }} />;
      }) || null}
      {showEditor && (
        <AddComment
          {...{
            ...props,
            comments: commentsForRow,
            line: rowNum,
            onEditorSubmit,
          }}
        />
      )}
    </div>
  );
};

const Pre = styled.pre`
  & code[class*="language-"] {
    padding-left: 0;
    overflow: hidden;
  }

  ${(p: { selectedLines: SimpleInterpolation }) => p.selectedLines}
`;

const HighlightFuncComponent: React.SFC<HighlightPreProps> = ({ ...props }) => {
  const { className, data, tokens, owner } = props;

  const codeRef = useRef<HTMLElement>(null);
  const comments = getCommentsForFile(data, owner);

  return (
    <Pre className={className} selectedLines={SelectLines(data)}>
      <code
        className={`code-content ${className}`}
        ref={codeRef}
        onMouseOut={(e: any): void => {
          setIsHovered(codeRef, e, false);
        }}
        onMouseOver={(e: any): void => {
          setIsHovered(codeRef, e, true);
        }}
      >
        {tokens.map((line, i) => (
          <RenderRow
            {...{ ...props, line, comments: comments[i + 1] }}
            rowNum={i + 1}
            key={i + 1}
          />
        ))}
      </code>
    </Pre>
  );
};

const useLoadLanguage = (lang: string, ref: any) => {
  const hasLoadedLanguage = useRef(false);
  const [loadingLang, setloadingLang] = useState(true);

  useEffect(() => {
    if (!hasLoadedLanguage.current) {
      loadLanguage(lang)
        .then(() => {
          setloadingLang(false);
          let highlightedCode = "";
          Prism.hooks.all = {};
          Prism.hooks.add("after-tokenize", ({ tokens }) => {
            // console.log("after-tokenize", tokens);
            const tkns = normalizeTokens(tokens);
            ///XXXcheck if i can stringufy the tokens
            /// for places without comments
            console.log("after-tokenize", tkns);
          });

          Prism.hooks.add("complete", env => {
            console.log("complete");
            highlightedCode = env.highlightedCode;
          });
          const element = document.createElement("code");
          // var code = element.textContent;
          element.textContent = ref.current.textContent;
          element.className = ref.current.className;
          new Promise(resolve => {
            // Prism.highlightAll(true, resolve);
            Prism.highlightElement(element, false, resolve);
          }).then(() => {
            // console.log("highlightedCode ", highlightedCode);
          });
          hasLoadedLanguage.current = true;
        })
        .catch(() => {
          Prism.highlightAll();
        });
    }
  }, []);
  return loadingLang;
};

export const CodeFile: React.SFC<Props> = ({ code, path, postId, owner }) => {
  const codeCodeRef = useRef<HTMLElement>(null);
  const lang = path ? filenameToLang(path) : "";
  const loadingLang = useLoadLanguage(lang, codeCodeRef);

  const variables = {
    path,
    postId,
  };

  return (
    <FindCodeReviewQuestionsComponent variables={variables}>
      {({ data, loading }) => {
        if (!data || loading || loadingLang) {
          return null;
        }

        return (
          <pre className={`line-numbers`}>
            <code ref={codeCodeRef} className={`language-${lang}`}>
              {code}
            </code>
          </pre>
        );

        // return (
        //   <pre className={`line-numbers`}>
        //     <code className={`language-${lang}`}>{code}</code>
        //   </pre>
        // );

        // return (
        //   <Highlight Prism={Prism} code={code || ""} language={lang}>
        //     {props => (
        //       <HighlightFuncComponent
        //         {...props}
        //         {...variables}
        //         owner={owner}
        //         data={data}
        //         code={code || ""}
        //         lang={lang}
        //       />
        //     )}
        //   </Highlight>
        // );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};
