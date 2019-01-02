import { useCallback, useEffect, useRef, useState } from "react";
import { CommentData, AddComment } from "./CommentSection";
import { CommentProps, CommentBox } from "./commentUI";
import { getScrollY } from "../utils/domScrollUtils";

interface RenderRowProps extends CommentData {
  comments: CommentProps[];
  line: string;
  owner: string;
  rowNum: number;
}

export const CommentsForRow: React.SFC<RenderRowProps> = ({
  comments,
  line,
  owner,
  rowNum,
  ...props
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [commentsForRow, setCommentsForRow] = useState(comments || []);
  const codeRef = useRef<HTMLDivElement>(null);

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

  const onOpenEditor = useCallback(({ target: elm }: any) => {
    if (
      elm.classList.contains("btn-open-edit") ||
      elm.classList.contains("btn-reply")
    ) {
      setShowEditor(true);
    }
  }, []);

  return (
    <>
      <div
        ref={codeRef}
        key={rowNum}
        className="token-line"
        dangerouslySetInnerHTML={{ __html: line }}
        onClick={onOpenEditor}
      />
      {commentsForRow.map((comment, key) => {
        return <CommentBox {...{ ...comment, key, onOpenEditor }} />;
      }) || null}
      {showEditor && (
        <AddComment
          {...props}
          comments={commentsForRow}
          line={rowNum}
          onEditorSubmit={onEditorSubmit}
        />
      )}
    </>
  );
};
