import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { AddComment } from "./CommentSection";
import { CommentProps, CommentBox } from "./commentUI";
import { getScrollY } from "../utils/domScrollUtils";
import { CodeFileContext } from "./CodeFileContext";
import { styled, MyButton } from "@codeponder/ui";

interface RenderLineProps {
  comments: CommentProps[];
  line: string;
  lineNum: number;
}

export const RenderLine: React.FC<RenderLineProps> = ({
  comments,
  line,
  lineNum,
}) => {
  const { owner } = useContext(CodeFileContext);
  const [showEditor, setShowEditor] = useState(false);
  const [commentsForRow, setCommentsForRow] = useState(comments || []);

  let preventScroll = false;
  let scrollPosition = getScrollY();
  const onEditorSubmit = ({ submitted, response, data }: any) => {
    if (submitted) {
      const { id, creator, __typename } =
        data.type == "question"
          ? response.data.createCodeReviewQuestion.codeReviewQuestion
          : response.data.createQuestionReply.questionReply;

      data.id = id;
      data.username = creator.username;
      data.isOwner = creator.username == owner;
      data.__typename = __typename;
      preventScroll = true;
      scrollPosition = getScrollY();
      setCommentsForRow([...commentsForRow, data]);
    }
    setShowEditor(false);
  };

  useEffect(
    () => {
      preventScroll = false;
    },
    [commentsForRow]
  );

  useEffect(() => {
    // prevent page scroll after submitting comment form
    const stopScroll = (event: UIEvent): void => {
      if (preventScroll) {
        event.preventDefault();
        window.scrollTo(0, scrollPosition);
      }
    };
    window.addEventListener("scroll", stopScroll);
    return () => {
      window.removeEventListener("scroll", stopScroll);
    };
  }, []);

  const onOpenEditor = useCallback(({ target: elm }: any) => {
    if (
      (elm.classList.contains("btn-open-edit") &&
        elm.parentNode.parentNode.classList.contains("is-hovered")) ||
      elm.classList.contains("btn-reply")
    ) {
      setShowEditor(true);
    }
  }, []);

  /*
  TODO:
  - move style to Pre style component or to Comments style component
  - add new style to comments nav bar
  - add actions to the nav bar
  - add top nav bar
  */

  // console.log("RenderLine", lineNum);

  const getLineWithCount = useCallback(
    () => {
      const count = commentsForRow.length;
      if (count) {
        return `<button class="comment-count-btn">${count}</button>${line}`;
      }
      return line;
    },
    [commentsForRow]
  );

  return (
    <>
      <tr key={lineNum} className="token-line">
        <td className="line-number" data-line-number={lineNum} />
        <td
          className="token-html"
          // dangerouslySetInnerHTML={{ __html: getLineWithCount() }}
          dangerouslySetInnerHTML={{ __html: line }}
          onClick={onOpenEditor}
        />
      </tr>
      {(showEditor || commentsForRow.length > 0) && (
        <tr className="discussion-container">
          <td colSpan={2}>
            <Discussion
              {...{
                comments: commentsForRow,
                onOpenEditor,
                showEditor,
                lineNum,
                onEditorSubmit,
              }}
            />
          </td>
        </tr>
      )}
    </>
  );
};

const DiscussionNavBar = styled.div`
  background-color: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  & .header-title {
    font-weight: 400;
    line-height: 1.125;
    margin-bottom: 0;
    word-wrap: break-word;

    & .discussion-number {
      color: #a3aab1;
      font-weight: 300;
      letter-spacing: -1px;
    }
  }

  & button {
    padding: 0.5em;
  }

  & .toggle-discussion {
    cursor: pointer;
    font-size: 1.5em;
    margin: 0 0 0 0.3em;
    opacity: 1;
    padding: 0 0.3em;
    vertical-align: middle;

    &:hover {
      opacity: 0.8;
    }

    & span {
      display: block;
      transition: transform 0.3s ease-in-out;
      &.is-open {
        transform: rotate(180deg);
      }
    }
  }
`;

const DiscussionContent = styled.div`
  max-height: 0;
  opacity: 0;
  transition: all 0.3s ease;

  &.is-open {
    max-height: 2000px;
    opacity: 1;
  }
`;

interface DiscussionProps {
  comments: CommentProps[];
  showEditor: boolean;
  lineNum: number;
  onOpenEditor: (props: any) => any;
  onEditorSubmit: (T?: any) => void;
}

const COLLAPSE = "Collapse this discussion";
const EXPANDED = "Expanded this discussion";

const Discussion: React.FC<DiscussionProps> = ({
  comments,
  showEditor,
  lineNum,
  onOpenEditor,
  onEditorSubmit,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const [showDiscussion, setDiscussion] = useState(false);

  const toggleDiscussionView = useCallback((e: any) => {
    const icon = e.target.firstChild;
    icon.classList.toggle("is-open");
    if (contentRef.current) {
      contentRef.current!.classList.toggle("is-open");
      setTimeout(() => {
        setDiscussion(val => !val);
      }, 300);
    } else {
      setDiscussion(val => !val);
    }
  }, []);

  useEffect(
    () => {
      if (showDiscussion) {
        contentRef.current!.classList.toggle("is-open");
      }
    },
    [showDiscussion]
  );

  const lineNumbers = useCallback(() => {
    const { startingLineNum, endingLineNum } = comments[0];
    if (startingLineNum == endingLineNum) {
      return `Line ${startingLineNum}`;
    }
    return `Lines ${startingLineNum} - ${endingLineNum}`;
  }, []);

  return (
    <>
      {comments.length && (
        <>
          <DiscussionNavBar>
            <h2 className="header-title">
              <span className="discussion-title">Title placeholder</span>{" "}
              <span className="discussion-number">#???</span>
              <span
                className="discussion-number"
                style={{ marginLeft: "2rem", fontSize: "1.5rem" }}
              >
                {lineNumbers()}
              </span>
            </h2>
            <div>
              <button>Add Reply ↓</button>
              <MyButton
                variant="primary"
                className="toggle-discussion"
                title={showDiscussion ? EXPANDED : COLLAPSE}
                onClick={toggleDiscussionView}
              >
                <span>▾</span>
              </MyButton>
            </div>
          </DiscussionNavBar>
          {showDiscussion && (
            <DiscussionContent ref={contentRef}>
              {comments.map((comment, key) => {
                return <CommentBox {...{ ...comment, key, onOpenEditor }} />;
              })}
            </DiscussionContent>
          )}
        </>
      )}
      {showEditor && (
        <AddComment
          comments={comments}
          line={lineNum}
          onEditorSubmit={onEditorSubmit}
        />
      )}
    </>
  );
};
