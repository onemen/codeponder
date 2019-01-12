import { useCallback, useContext, useEffect, useState, useRef } from "react";
import { AddComment } from "./CommentSection";
import { CommentProps, CommentBox } from "./commentUI";
import { getScrollY } from "../utils/domScrollUtils";
import { CodeFileContext } from "./CodeFileContext";
import { styled } from "@codeponder/ui";

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

  return (
    <div key={lineNum} className="token-line">
      <span className="line-number" data-line-number={lineNum} />
      <span
        className="token-html"
        dangerouslySetInnerHTML={{ __html: line }}
        onClick={onOpenEditor}
      />
      <Discussion comments={commentsForRow} onOpenEditor={onOpenEditor} />
      {showEditor && (
        <AddComment
          comments={commentsForRow}
          line={lineNum}
          onEditorSubmit={onEditorSubmit}
        />
      )}
    </div>
  );
};

const DiscussionNavBar = styled.div`
  background-color: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;

  & .header-title {
    font-weight: 400;
    line-height: 1.125;
    margin-bottom: 0;
    word-wrap: break-word;
  }

  & .header-sub-title {
    color: #a3aab1;
    font-weight: 300;
    letter-spacing: -1px;
  }
`;

interface DiscussionProps {
  comments: CommentProps[];
  onOpenEditor: (props: any) => any;
}

const COLLAPSE = "Collapse this discussion";
const EXPANDED = "Expanded this discussion";

const lineNumbers = (comment: CommentProps) => {
  const { startingLineNum, endingLineNum } = comment;
  if (startingLineNum == endingLineNum) {
    return `Line ${startingLineNum}`;
  }
  return `Lines ${startingLineNum} - ${endingLineNum}`;
};

const Discussion: React.FC<DiscussionProps> = ({ comments, onOpenEditor }) => {
  const count = comments.length;
  if (!count) {
    return null;
  }

  const discussionRef = useRef<HTMLDivElement>(null);
  const [showDiscussion, setShowDiscussion] = useState(false);

  const onToggleDiscussion = useCallback(({ target: elm }: any) => {
    if (elm.classList.contains("discussion-badge")) {
      elm.classList.toggle("is-open");
      if (discussionRef.current) {
        discussionRef.current!.classList.remove("is-open");
        // remove the component after the transition ends
        setTimeout(() => {
          setShowDiscussion(false);
        }, 400);
      } else {
        setShowDiscussion(true);
      }
    }
  }, []);

  useEffect(
    () => {
      if (showDiscussion) {
        discussionRef.current!.classList.add("is-open");
      }
    },
    [showDiscussion]
  );

  return (
    <>
      <button
        className="token-btn discussion-badge"
        title={showDiscussion ? COLLAPSE : EXPANDED}
        onClick={onToggleDiscussion}
      >
        <span className="badge-counter">{count}</span>
        <span className="badge-icon">▾</span>
      </button>
      {showDiscussion && (
        <div ref={discussionRef} className="discussion-container">
          <div className="discussion-inner-box">
            <DiscussionNavBar>
              <h2 className="header-title">
                <span className="discussion-title">Title placeholder</span>{" "}
                <span className="header-sub-title">#???</span>
              </h2>
              <span className="header-sub-title">
                {lineNumbers(comments[0])}
              </span>
            </DiscussionNavBar>
            {comments.map((comment, key) => {
              return <CommentBox {...{ ...comment, key, onOpenEditor }} />;
            })}
          </div>
        </div>
      )}
    </>
  );
};
