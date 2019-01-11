import { useCallback, useContext, useEffect, useRef, useState } from "react";
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
  const lineRef = useRef<HTMLTableRowElement>(null);
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
    <>
      <tr ref={lineRef} key={lineNum} className="token-line">
        <td className="line-number" data-line-number={lineNum} />
        <td
          className="token-html"
          dangerouslySetInnerHTML={{ __html: line }}
          onClick={onOpenEditor}
        />
      </tr>
      {(showEditor || commentsForRow.length > 0) && (
        <tr className="comments-container">
          <td colSpan={2}>
            <CommentsSection
              {...{
                comments: commentsForRow,
                onOpenEditor,
                showEditor,
                lineNum,
                onEditorSubmit,
              }}
            />
            {/* commentsForRow.length > 0 && (
                             <div
                style={{
                  backgroundColor: "#f6f8fa",
                  // border: "1px solid #e1e4e8",
                  // borderRadius: "3px 3px 0 0",
                  borderBottom: "1px solid #e1e4e8",
                  padding: "10px",
                  textAlign: "right",
                }}
              >
                <button style={{ padding: "0.5em" }}>Add Reply ↓</button>
                <button style={{ padding: "0.5em" }}>View ▾</button>
              </div>
            ) */}
            {/* commentsForRow.map((comment, key) => {
              return <CommentBox {...{ ...comment, key, onOpenEditor }} />;
            }) || null */}
            {/* showEditor && (
              <AddComment
                comments={commentsForRow}
                line={lineNum}
                onEditorSubmit={onEditorSubmit}
              />
            ) */}
          </td>
        </tr>
      )}
    </>
  );
};

const CommentsNav = styled.div`
  background-color: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  padding: 10px;
  text-align: right;

  & button {
    padding: 0.5em;
  }
`;

const CommentsNavBar = () => {
  return (
    <CommentsNav>
      <button>Add Reply ↓</button>
      <button>View ▾</button>
    </CommentsNav>
  );
};

interface CommentsSectionProps {
  comments: CommentProps[];
  showEditor: boolean;
  lineNum: number;
  onOpenEditor: (props: any) => any;
  onEditorSubmit: (T?: any) => void;
}

const CommentsSection = ({
  comments,
  showEditor,
  lineNum,
  onOpenEditor,
  onEditorSubmit,
}: CommentsSectionProps) => {
  return (
    <>
      {comments && <CommentsNavBar />}
      {comments.map((comment, key) => {
        return <CommentBox {...{ ...comment, key, onOpenEditor }} />;
      }) || null}
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
