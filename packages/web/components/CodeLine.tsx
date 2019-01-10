import { useCallback, useContext, useEffect, useRef, useState } from "react";
import { AddComment } from "./CommentSection";
import { CommentProps, CommentBox } from "./commentUI";
import { getScrollY } from "../utils/domScrollUtils";
import { CodeFileContext } from "./CodeFileContext";

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
        <tr className="comments-row">
          <td
            className="line-comments"
            style={{
              borderTop: "1px solid #e1e4e8",
              borderBottom: "1px solid #e1e4e8",
              padding: "0.75em",
            }}
            colSpan={2}
          >
            <div
              style={{
                border: "1px solid #dfe2e5",
                borderRadius: "3px",
              }}
            >
              {commentsForRow.length > 0 && (
                <div
                  style={{
                    backgroundColor: "#f6f8fa",
                    border: "1px solid #e1e4e8",
                    borderRadius: "3px 3px 0 0",
                    padding: "10px",
                    textAlign: "right",
                  }}
                >
                  <button style={{ padding: "0.5em" }}>Add Reply ↓</button>
                  <button style={{ padding: "0.5em" }}>View ▾</button>
                </div>
              )}
              {commentsForRow.map((comment, key) => {
                return <CommentBox {...{ ...comment, key, onOpenEditor }} />;
              }) || null}
              {showEditor && (
                <AddComment
                  comments={commentsForRow}
                  line={lineNum}
                  onEditorSubmit={onEditorSubmit}
                />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};
