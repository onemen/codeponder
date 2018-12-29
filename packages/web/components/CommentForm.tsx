import * as React from "react";

import { useInputValue } from "../utils/useInputValue";
import { MyButton, styled } from "@codeponder/ui";

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
  startingLineNum: number;
  endingLineNum: number;
  getFormResult: Function;
  type: "reply" | "question";
}

export const TextEditor = ({
  startingLineNum,
  endingLineNum,
  getFormResult,
  type,
}: TextEditorProps) => {
  const [start, startingLineNumChange] = useInputValue(
    String(startingLineNum) || String(endingLineNum)
  );
  const [end, endingLineNumChange] = useInputValue(String(endingLineNum));
  const [text, textChange] = useInputValue("");
  return (
    <Container>
      <div className="code-snippet">
        <strong>Code Snippet</strong>
        <label>
          Starting Line:
          <input
            disabled={type == "reply"}
            name="startingLineNum"
            type="number"
            min="1"
            max={endingLineNum}
            value={start}
            onChange={startingLineNumChange}
          />
        </label>
        <label>
          Ending Line:
          <input
            disabled
            name="endingLineNum"
            type="number"
            value={end}
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
                startingLineNum: parseInt(start, 10),
                endingLineNum: parseInt(end, 10),
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
