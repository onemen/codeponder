import React, { useRef, useEffect } from "react";

import { useInputValue } from "../utils/useInputValue";
import { isScrolledIntoView, getScrollY } from "../utils/domScrollUtils";
import { MyButton, styled, Label, BlueInput } from "@codeponder/ui";
import { CommentBoxContainer } from "./commentUI";

interface FormInputProps {
  minHeight?: string;
  width?: string;
}

const FormInput = styled(BlueInput)`
  background: #f2f2f2;
  border: 1px solid transparent;
  font-size: 1em;
  min-height: ${(p: FormInputProps) => p.minHeight};
  padding: 0.6rem 1rem;
  width: ${(p: FormInputProps) => p.width || "100%"};

  &:focus {
    border: 1px solid #d1d5da;
    box-shadow: inset 0 1px 2px rgba(27, 31, 35, 0.075),
      0 0 0 0.2em rgba(3, 102, 214, 0.3);
  }

  &[type="number"]::-webkit-inner-spin-button,
  &[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type="number"] {
    -moz-appearance: textfield;
  }
`;

const FormRow = styled.div`
  padding: 1rem 0.5em;
`;

const Separator = styled.div`
  width: 100%
  height: 1;
  background: #f2f2f2;
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  margin: 0.625em;

  & .btn-box {
    display: flex;
    justify-content: flex-end;
    padding: 0.8em 0.4em;
    & button {
      min-width: 6em;
    }
  }
`;

export interface TextEditorProps {
  isReplay: boolean;
  startingLineNum?: number;
  endingLineNum: number;
  submitForm: (props: TextEditorResult) => Promise<void>;
  type: "reply" | "question";
}

export interface TextEditorResult {
  cancel: boolean;
  startingLineNum: number;
  endingLineNum: number;
  title: string;
  text: string;
}

export const TextEditor = (props: TextEditorProps) => {
  const { isReplay, startingLineNum, endingLineNum, submitForm, type } = props;

  const formRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const [title, titleChange] = useInputValue("");
  const [start, startingLineNumChange] = useInputValue(
    String(startingLineNum || endingLineNum)
  );
  const [end, endingLineNumChange] = useInputValue(String(endingLineNum));
  const [text, textChange] = useInputValue("");

  const titleTrimmed = (() => title.trim())();
  const textTrimmed = (() => text.trim())();
  const isValidForm = titleTrimmed && textTrimmed;

  // focus title
  useEffect(() => {
    if (inputRef) {
      inputRef.current!.focus();
    }
  }, []);

  // make sure the editor is fully visible
  useEffect(() => {
    const elm = formRef.current!.parentElement!.parentElement;
    const { offsetBottom = 0 } = isScrolledIntoView(elm);
    if (offsetBottom > 0) {
      window.scrollTo(0, getScrollY() + offsetBottom + 50);
    }
  }, []);

  // close editor with Esc if user did not start editing
  const onKeyDown = ({ keyCode }: any) => {
    if (keyCode == 27 && !textTrimmed) {
      submitForm({ cancel: true } as TextEditorResult);
    }
  };

  return (
    <CommentBoxContainer>
      <Container ref={formRef} onKeyDown={onKeyDown}>
        {// hide title and line numbers on reply
        !isReplay && (
          <>
            <FormRow>
              <FormInput
                ref={inputRef}
                placeholder="Title"
                name="title"
                value={title}
                onChange={titleChange}
              />
            </FormRow>
            <FormRow>
              <Label style={{ paddingBottom: ".4rem" }}>Line numbers</Label>
              <FormInput
                disabled={isReplay}
                name="startingLineNum"
                min="1"
                max={endingLineNum}
                type="number"
                value={start}
                width="5em"
                onChange={startingLineNumChange}
              />
              <span style={{ padding: "0px 1rem" }}>–</span>
              <FormInput
                disabled
                name="endingLineNum"
                value={end}
                width="5em"
                onChange={endingLineNumChange}
              />
            </FormRow>
            <Separator />
          </>
        )}

        <FormRow>
          <FormInput
            ref={isReplay ? inputRef : null}
            minHeight="100px"
            name="question"
            placeholder={
              type == "reply" ? "Type your Reply" : "Type your Question"
            }
            value={text}
            onChange={textChange}
            as="textarea"
          />
        </FormRow>
        <Separator />
        <div className="btn-box">
          <MyButton
            variant="form"
            className="btn"
            onClick={() => {
              submitForm({ cancel: true } as TextEditorResult);
            }}
          >
            Cancel
          </MyButton>
          <MyButton
            variant="form"
            {...(isValidForm ? "" : "disabled")}
            className={`primary ${isValidForm ? "" : "disabled"}`}
            onClick={() => {
              if (isValidForm) {
                submitForm({
                  cancel: false,
                  startingLineNum: parseInt(start, 10),
                  endingLineNum: parseInt(end, 10),
                  title: titleTrimmed,
                  text: textTrimmed,
                });
              }
            }}
          >
            Save
          </MyButton>
        </div>
      </Container>
    </CommentBoxContainer>
  );
};
