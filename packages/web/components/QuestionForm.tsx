import * as React from "react";

import { DebounceInput } from "react-debounce-input";

import { CreateCodeReviewQuestionComponent } from "./apollo-components";
import { useInputValue } from "../utils/useInputValue";
import { wrapEditor } from "./commentUI";
import { TextEditor, TextEditorResult } from "./CommentForm";

export interface QuestionFormProps {
  code?: string;
  path?: string;
  postId: string;
  programmingLanguage?: string;
  startLinesSelection: number;
  endLinesSelection: number;
  handleLinesSelection: (event: any, inputNumber: number) => void;
}

export const QuestionForm = ({
  code,
  path,
  postId,
  programmingLanguage,
  startLinesSelection,
  endLinesSelection,
  handleLinesSelection,
}: QuestionFormProps) => {
  const [text, textChange] = useInputValue("");

  return (
    <CreateCodeReviewQuestionComponent>
      {mutate => (
        <form
          onSubmit={async e => {
            e.preventDefault();
            const start = startLinesSelection;
            const end = endLinesSelection;
            const response = await mutate({
              variables: {
                codeReviewQuestion: {
                  startingLineNum: start,
                  endingLineNum: end,
                  codeSnippet: !code
                    ? null
                    : code
                        .split("\n")
                        .slice(start - 1, end)
                        .join("\n"),
                  text: text,
                  path,
                  postId,
                  programmingLanguage,
                },
              },
            });

            console.log(response);
          }}
        >
          {/* see https://www.npmjs.com/package/react-debounce-input */}
          <DebounceInput
            name="startingLineNum"
            placeholder="0"
            value={startLinesSelection}
            debounceTimeout={300}
            onChange={ev => handleLinesSelection(ev, 0)}
          />
          <DebounceInput
            name="endingLineNum"
            placeholder="0"
            value={endLinesSelection}
            debounceTimeout={300}
            onChange={ev => handleLinesSelection(ev, 1)}
          />
          <input
            name="question"
            placeholder="question"
            value={text}
            onChange={textChange}
          />
          <button type="submit">save</button>
        </form>
      )}
    </CreateCodeReviewQuestionComponent>
  );
};

export interface BaseQuestionProps {
  onEditorSubmit: (T?: any) => void;
  code?: string;
  path?: string;
  postId: string;
  programmingLanguage?: string;
}

export interface QuestionProps extends BaseQuestionProps {
  isReplay: boolean;
  startingLineNum?: number; // not exist before the first commnet created
  endingLineNum: number;
}

const WrappedTextEditor = wrapEditor(TextEditor);

// TODO: fix type defenition
export const CreateQuestion = ({
  code,
  path,
  postId,
  programmingLanguage,
  onEditorSubmit,
  ...props
}: QuestionProps) => (
  <CreateCodeReviewQuestionComponent>
    {mutate => {
      const submitForm = async ({
        cancel,
        startingLineNum,
        endingLineNum,
        text,
      }: TextEditorResult) => {
        if (!cancel) {
          // save result
          const codeReviewQuestion = {
            startingLineNum,
            endingLineNum,
            codeSnippet: !code
              ? null
              : code
                  .split("\n")
                  .slice(startingLineNum - 1, endingLineNum)
                  .join("\n"),
            text: text,
            path,
            postId,
            programmingLanguage,
          };
          // const response = await mutate({
          //   variables: {
          //     codeReviewQuestion,
          //   },
          // });
          const response = {};
          console.log(response);
          onEditorSubmit({
            response,
            data: { type: "question", codeReviewQuestion },
          });
        } else {
          onEditorSubmit();
        }
      };
      return <WrappedTextEditor {...{ ...props, submitForm }} />;
    }}
  </CreateCodeReviewQuestionComponent>
);
