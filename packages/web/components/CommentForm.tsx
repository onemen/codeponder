import * as React from "react";

import { useInputValue } from "../utils/useInputValue";
import styled from "styled-components";
import { MyButton } from "@codeponder/ui";

const Container = styled.div`
  display: flex;
  flex-direction: column;

  & .code-snippet {
    padding: 0.4em;
    border-bottom: 1px solid #999;
  }

  & .code-snippet input {
    margin-left: 0.5em;
    width: 5em;
  }

  & .code-snippet label {
    margin-left: 1em;
  }

  & textarea {
    border: none;
  }

  & .btn-box {
    border-top: 1px solid #999;
    display: flex;
    justify-content: flex-end;
    padding: 0.4em;
  }
`;

interface TextEditorProps {
  line: number;
  getFormResult: Function;
}

export const TextEditor = ({ line, getFormResult }: TextEditorProps) => {
  const [startingLineNum, startingLineNumChange] = useInputValue(String(line));
  const [endingLineNum, endingLineNumChange] = useInputValue(String(line));
  const [text, textChange] = useInputValue("");
  return (
    <Container>
      <div className="code-snippet">
        <strong>Code Snippet</strong>
        <label>
          Starting Line:
          <input
            name="startingLineNum"
            type="number"
            min="1"
            max={line}
            value={startingLineNum}
            onChange={startingLineNumChange}
          />
        </label>
        <label>
          Ending Line:
          <input
            disabled
            name="endingLineNum"
            type="number"
            value={endingLineNum}
            onChange={endingLineNumChange}
          />
        </label>
      </div>
      <textarea
        autoFocus
        className="comment-text"
        id="editor"
        name="editor"
        rows={5}
        placeholder="Leave a comment"
        onChange={textChange}
      />
      <div className="btn-box">
        <MyButton
          variant="form"
          className="btn"
          onClick={() => {
            getFormResult({ cancel: true });
          }}
        >
          Cancel
        </MyButton>
        <MyButton
          variant="form"
          {...(text ? "" : "disabled")}
          className={`primary ${text ? "" : "disabled"}`}
          onClick={() => {
            text.trim() &&
              getFormResult({
                startingLineNum: parseInt(startingLineNum, 10),
                endingLineNum: parseInt(endingLineNum, 10),
                text,
              });
          }}
        >
          Save
        </MyButton>
      </div>
    </Container>
  );
};
