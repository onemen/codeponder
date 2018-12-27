import * as React from "react";

import { useInputValue } from "../utils/useInputValue";
import styled from "styled-components";

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

  & .btn {
    border: 1px solid rgba(27, 31, 35, 0.2);
    border-radius: 0.25em;
    color: rgb(36, 41, 46);
    font-size: 1em;
    font-weight: 600;
    margin-right: 1em;
    padding: 0.375em 0.75em;
  }

  & .btn:hover {
    background-color: #e6ebf1;
    background-image: linear-gradient(-180deg, #f0f3f6, #e6ebf1 90%);
    background-position: -0.5em;
    border-color: rgba(27, 31, 35, 0.35);
  }

  & .btn-primary {
    background-color: #28a745;
    background-image: linear-gradient(-180deg, #34d058, #28a745 90%);
    color: #fff;
  }

  & .btn-primary:hover {
    background-color: #269f42;
    background-image: linear-gradient(-180deg, #2fcb53, #269f42 90%);
    background-position: -0.5em;
    border-color: rgba(27, 31, 35, 0.5);
  }

  & .btn-primary.disabled {
    background-color: #94d3a2;
    background-image: none;
    border-color: rgba(27, 31, 35, 0.2);
    box-shadow: none;
    color: hsla(0, 0%, 100%, 0.75);
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
        <button
          className="btn"
          onClick={() => {
            getFormResult({ cancel: true });
          }}
        >
          Cancel
        </button>
        <button
          className={`btn btn-primary ${text ? "" : "disabled"}`}
          onClick={() => {
            getFormResult({
              startingLineNum: parseInt(startingLineNum, 10),
              endingLineNum: parseInt(endingLineNum, 10),
              text,
            });
          }}
        >
          Save
        </button>
      </div>
    </Container>
  );
};
