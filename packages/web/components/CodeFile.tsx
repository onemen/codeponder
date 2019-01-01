import { useRef, useState, useEffect } from "react";
import * as Prism from "prismjs";
import "prismjs/themes/prism-coy.css";
import Highlight, { Token, RenderProps } from "prism-react-renderer";
import { IconButton, styled, css, SimpleInterpolation } from "@codeponder/ui";
import { CommentProps, Comments, LineNo, CommentBox } from "./commentUI";

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

interface Props {
  code: string | null;
  path?: string;
  postId: string;
}

interface HighlightPreProps extends RenderProps, CommentData {
  data: FindCodeReviewQuestionsQuery;
}
interface RenderRowProps extends CommentData {
  line: Token[];
  comments: Comments;
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

const getCommentsForFile = (prop: FindCodeReviewQuestionsQuery): Comments => {
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
    isOwner: true, // Todo: need to get real value
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
  ...props
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [commentsForRow, setCommentsForRow] = useState(comments[rowNum] || []);

  const onReplyClicked = () => {
    setShowEditor(true);
  };

  let submitting = false;
  const onEditorSubmit = async (result: any) => {
    if (result) {
      result.data.username = "John D.";
      result.data.isOwner = false;
      try {
        const response = await result.response;
        console.log(response);
      } catch (ex) {
        console.log("Error when saving form", result.data.typem, ex);
      }
      submitting = true;
      setCommentsForRow([...commentsForRow, result.data]);
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

  return (
    <div {...getLineProps({ line, key: rowNum })}>
      <LineNo>{rowNum}</LineNo>
      <IconButton
        style={{ margin: "-2px 0px -2px -20px" }}
        variant="primary"
        icon="plus"
        className="hidden"
        onClick={() => {
          setShowEditor(true);
        }}
      />
      {line.map((token, key) => (
        <span {...getTokenProps({ token, key })} />
      ))}
      {commentsForRow.map((comment, key) => {
        return <CommentBox {...{ ...comment, key, onReplyClicked }} />;
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
  const { className, data, tokens } = props;

  const codeRef = useRef<HTMLElement>(null);
  const comments = getCommentsForFile(data);

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
            {...{ ...props, line, comments }}
            rowNum={i + 1}
            key={i + 1}
          />
        ))}
      </code>
    </Pre>
  );
};

const useLoadLanguage = (lang: string) => {
  const hasLoadedLanguage = useRef(false);
  const [loadingLang, setloadingLang] = useState(true);

  useEffect(() => {
    if (!hasLoadedLanguage.current) {
      loadLanguage(lang)
        .then(() => {
          setloadingLang(false);
          hasLoadedLanguage.current = true;
        })
        .catch(() => {});
    }
  }, []);
  return loadingLang;
};

export const CodeFile: React.SFC<Props> = ({ code, path, postId }) => {
  const lang = path ? filenameToLang(path) : "";
  const loadingLang = useLoadLanguage(lang);

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
          <Highlight Prism={Prism} code={code || ""} language={lang}>
            {props => (
              <HighlightFuncComponent
                {...props}
                {...variables}
                data={data}
                code={code || ""}
                lang={lang}
              />
            )}
          </Highlight>
        );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};
