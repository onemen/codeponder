import { useEffect, useState } from "react";
import { CreateQuestion } from "./QuestionForm";
import { Comments, CommentBox, CommentProps } from "./commentUI";
import { CreateQuestionReply } from "./QuestionReply";
import { Dispatch, SetStateAction } from "react";

export interface CommentData {
  code: string;
  path?: string;
  lang: string;
  postId: string;
}

export interface CommentSectionProps extends CommentData {
  commentsForFile: Comments;
  line: number;
  useEditor: [number, Dispatch<SetStateAction<number>>];
}

export const CommentSection = ({
  commentsForFile,
  line,
  useEditor,
  ...props
}: CommentSectionProps) => {
  /*
//xxx  console.log("CommentSection start", {
    line,
    comments: commentsForFile[line],
  });
  */
  const [showEditor, setShowEditor] = useEditor;
  const [comments, setCommnets] = useState(commentsForFile[line]);
  const [, setEditorOpen] = useState(showEditor > 0);

  // const comments = commentsForFile[line];
  useEffect(() => {
    //xxx  console.log("CommentSection useEffect", { showEditor, comments, line });
    return () => {
      //xxx  console.log("CommentSection unmount for line", line);
    };
  });

  // if (!comments && showEditor != line) {
  // //xxx  console.log("CommentSection return null");
  //   return null;
  // }

  const onReplyClicked = () => {
    setShowEditor(line);
  };

  // const onEditorSubmit = (comment?: CommentProps) => {
  const onEditorSubmit = async (result?: any) => {
    setShowEditor(0);
    if (result || !result) {
      return;
    }
    if (result) {
      // cancel || {
      //   username: "John D.", // TODO
      //   isOwner: false, // TODO
      //   type: "reply",
      //   text,
      // }
      // onEditorSubmit({ response, data: { type: "reply", text } });
      //xxx  console.log("before setCommnets", comments.length);
      result.data.username = "John D.";
      result.data.isOwner = false;
      // setCommnets(a => {
      // //xxx  console.log("in setCommnets", a);
      //   a.push(result.data);
      //   return a;
      //   // return [...a, result.data];
      // });
      // setCommnets([]);
      // comments.push(result.data);
      setCommnets([...comments, result.data]);
      //xxx  console.log("after setCommnets", comments.length);

      const response = await result.response;
      console.log(response, comments.length);
    }
    setEditorOpen(false);
    // setShowEditor(0);
    //xxx  console.log("after onEditorSubmit", result);
  };

  return (
    <div className="CommentSection">
      {(comments || []).map((comment, key) => (
        <CommentBox {...{ ...comment, key, onReplyClicked }} />
      )) || null}
      <AddComment
        {...{
          showEditor,
          comments,
          line,
          onEditorSubmit,
          ...props,
        }}
      />
    </div>
  );
};

interface AddCommentProps extends CommentData {
  onEditorSubmit: (T?: any) => void;
  // showEditor: number;
  comments: CommentProps[];
  line: number;
}

export const AddComment: React.SFC<AddCommentProps> = ({
  // showEditor,
  comments,
  line,
  lang,
  ...props
}) => {
  // if (line != showEditor) {
  //   return null;
  // }
  // console.trace("AddComment starts");
  //xxx  console.log("render editor for row", line);
  //xxx  console.log("comments for row", line, comments);

  const isReplay = comments.length > 0;
  const question = isReplay ? comments[0] : undefined;

  const commentProps = {
    isReplay,
    endingLineNum: line,
    programmingLanguage: lang,
    ...props,
  };

  return isReplay ? (
    <CreateQuestionReply
      {...{
        ...commentProps,
        startingLineNum: question!.startingLineNum,
        questionId: question!.id,
      }}
    />
  ) : (
    <CreateQuestion {...commentProps} />
  );
};
