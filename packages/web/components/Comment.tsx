import styled from "styled-components";
import { TextEditor } from "./CommentForm";
import { CreateCodeReviewQuestionComponent } from "./apollo-components";

export const getBorderColor = (type: string) => {
  const colors: { [key: string]: string } = {
    question: "rgb(238, 238, 88)",
    replay: "rgb(235, 73, 144)",
    editor: "rgb(0, 238, 88)",
  };
  return colors[type];
};

export const LineNo = styled.a<{ cursor?: string }>`
  border-right: 1px solid #999;
  color: #999;
  cursor: ${p => p.cursor || "pointer"};
  display: inline-block;
  letter-spacing: -1px;
  margin-right: 0.65em;
  padding-right: 0.8em;
  text-align: right;
  user-select: none;
  width: 3em;
`;

const CommentBoxContainer = styled.div<{ color?: string }>`
  background-color: #fff;
  display: grid;
  grid-template-columns: 3em auto;
  grid-column-gap: 0.65em;

  & .comment-innder-box {
    border: 1px solid #999;
    border-left: 10px solid ${p => p.color || getBorderColor("question")};
    margin: 4px 0;
  }

  & .comment-title {
    padding: 0.5em;
    border-bottom: 1px solid #999;
  }

  & .comment-creator {
    font-weight: 600;
  }

  & .repo-owner {
    background-color: rgb(253, 243, 218);
    border: 1px solid rgb(233, 219, 205);
    margin-left: 0.5em;
    padding: 2px 4px;
  }

  & .comment-text {
    margin: 0;
    padding: 0.5em;
    white-space: normal;
  }
`;

export interface CommentProps {
  text?: string;
  username?: string;
  isOwner?: boolean;
  type: string;
  index?: number;
}

export const CommentBox: React.SFC<CommentProps> = ({
  username,
  text,
  isOwner,
  type,
  index,
}) => (
  <CommentBoxContainer color={getBorderColor(type)}>
    <LineNo cursor="default" />
    <div className="comment-innder-box">
      <div className="comment-title">
        <span className="comment-creator">{username}</span>
        {isOwner ? <span className="repo-owner">Author</span> : null}
        <span style={{ marginLeft: "20px" }}>{type}</span>
        <span style={{ marginLeft: "20px" }}>{index}</span>
      </div>
      <p className="comment-text">
        {text}
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Est
        consequuntur modi quas alias placeat aliquam vitae explicabo magni saepe
        commodi. Corporis ullam ratione fugit optio tempore provident voluptates
        commodi quasi!
      </p>
    </div>
  </CommentBoxContainer>
);

export interface AddCommentProps {
  line: number;
  closeCommentEditor: Function;
  code?: string;
  path?: string;
  postId: string;
  programmingLanguage?: string;
}

export interface TextEditorResult {
  cancel: boolean;
  startingLineNum: number;
  endingLineNum: number;
  text: string;
}

export const AddComment: React.SFC<AddCommentProps> = ({
  line,
  closeCommentEditor,
  code,
  ...props
}) => {
  return (
    <CreateCodeReviewQuestionComponent>
      {mutate => {
        const getFormResult = async ({
          cancel,
          startingLineNum,
          endingLineNum,
          text,
        }: TextEditorResult) => {
          if (!cancel) {
            // save result
            const response = await mutate({
              variables: {
                codeReviewQuestion: {
                  startingLineNum,
                  endingLineNum,
                  codeSnippet: !code
                    ? null
                    : code
                        .split("\n")
                        .slice(startingLineNum - 1, endingLineNum)
                        .join("\n"),
                  text: text,
                  ...props,
                },
              },
            });
            console.log(response);
          }

          closeCommentEditor();
          console.log("resulr from textEditor form", {
            cancel,
            startingLineNum,
            endingLineNum,
            text,
          });
        };
        return (
          <CommentBoxContainer color={getBorderColor("editor")}>
            <LineNo cursor="default" />
            <div className="comment-innder-box">
              <TextEditor line={line} getFormResult={getFormResult} />
            </div>
          </CommentBoxContainer>
        );
      }}
    </CreateCodeReviewQuestionComponent>
  );
};
