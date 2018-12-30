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

interface Props extends CommentData {
  commentsForFile: Comments;
  line: number;
  useEditor: [number, Dispatch<SetStateAction<number>>];
}

export const CommentSection = ({
  commentsForFile,
  line,
  useEditor,
  ...props
}: Props) => {
  const [showEditor, setShowEditor] = useEditor;
  const comments = commentsForFile[line];

  return (
    <div>
      {(comments || []).map((comment, key) => (
        <CommentBox
          {...comment}
          key={key}
          onReply={() => {
            setShowEditor(line);
          }}
        />
      )) || null}
      <AddComment
        {...{
          showEditor,
          comments,
          line,
          closeCommentEditor: () => setShowEditor(0),
          ...props,
        }}
      />
    </div>
  );
};

interface AddCommentProps extends CommentData {
  closeCommentEditor: () => void;
  showEditor: number;
  comments: CommentProps[];
  line: number;
}

const AddComment: React.SFC<AddCommentProps> = ({
  showEditor,
  comments,
  line,
  lang,
  ...props
}) => {
  if (line != showEditor) {
    return null;
  }

  const isReplay = !!comments;
  const question = comments ? comments[0] : undefined;

  const commentProps = {
    isReplay,
    startingLineNum: question!.startingLineNum,
    endingLineNum: line,
    questionId: question!.id,
    programmingLanguage: lang,
    ...props,
  };

  return isReplay ? (
    <CreateQuestionReply {...commentProps} />
  ) : (
    <CreateQuestion {...commentProps} />
  );
};
