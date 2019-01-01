import * as React from "react";

import { useInputValue } from "../utils/useInputValue";
import { MyButton, styled } from "@codeponder/ui";
import { useRef } from "react";
import { useEffect } from "react";

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding-left: 0.35em;

  & .code-snippet {
    padding: 0.8em 0;
    border-bottom: 1px solid #999;
  }

  & .code-snippet input {
    margin-left: 0.5em;
    width: 5em;
  }

  & .code-snippet label {
    margin-left: 1em;
  }

  & .form-control {
    border: none;
    display: block;
    max-height: 500px;
    min-height: 100px;
    padding: 8px;
    resize: vertical;
    width: 100%;
    color: #24292e;
    font-size: 16px;
    line-height: 20px;
    min-height: 34px;
    outline: none;
    vertical-align: middle;
    word-wrap: break-word;

    border: 1px solid #d1d5da;
    border-radius: 3px;
    border-color: #2188ff;
    box-shadow: inset 0 1px 2px rgba(27, 31, 35, 0.075),
      0 0 0 0.35em rgba(3, 102, 214, 0.3);
  }

  & .btn-box {
    border-top: 1px solid #999;
    display: flex;
    justify-content: flex-end;
    padding: 0.8em 0.4em;
    & button {
      min-width: 6em;
    }
  }

  /*   border-style: solid;
  border-width: 1px;
  display: block; */
  /*   width: 100px;
  height: 100px; */
  /* height: 200px; */
  opacity: 1;
  /* background-color: #0000ff; */
  /* -webkit-transition: width 2s, height 2s, background-color 2s, */
  /* -webkit-transform 2s; */
  /* transition: opacity 1s, width 2s, height 2s, background-color 2s, transform 2s; */
  transition: opacity 1s, width 2s, height 2s;

  &.animate {
    /* background-color: #ffcccc; */
    /* width: 0; */
    height: 0;
    opacity: 0;
    /* -webkit-transform: rotate(180deg);
    // transform: rotate(180deg); */
  }
`;

export interface TextEditorProps {
  isReplay: boolean;
  startingLineNum?: number;
  endingLineNum: number;
  submitForm: Function;
}

export interface TextEditorResult {
  cancel: boolean;
  startingLineNum: number;
  endingLineNum: number;
  text: string;
}

function isScrolledIntoView(elm: HTMLElement | null) {
  if (!elm) {
    return { isVisible: false };
  }
  const rect = elm.getBoundingClientRect();
  const elemTop = rect.top;
  const elemBottom = rect.bottom;

  // Only completely visible elements return true:
  // return elemTop >= 0 && elemBottom <= window.innerHeight;
  return {
    isVisible: elemTop >= 0 && elemBottom <= window.innerHeight,
    offsetTop: elemTop,
    offsetBottom: elemBottom - window.innerHeight,
  };
}

export const TextEditor = (props: TextEditorProps) => {
  // const [loading, setloading] = useState(window.scrollY);
  const codeRef = useRef<HTMLDivElement>(null);
  const { isReplay, startingLineNum, endingLineNum, submitForm } = props;
  const [start, startingLineNumChange] = useInputValue(
    String(startingLineNum || endingLineNum)
  );
  const [end, endingLineNumChange] = useInputValue(String(endingLineNum));
  const [text, textChange] = useInputValue("");

  const textTrimmed = (() => text.trim())();

  let stopScrolling = false;
  // const top = window.scrollY;
  useEffect(() => {
    const elm = codeRef.current!.parentElement!.parentElement;
    const { isVisible, offsetBottom = 0 } = isScrolledIntoView(elm);
    console.log("editor is visible", isScrolledIntoView(elm));
    if (offsetBottom > 0) {
      // IE not supporting window.scrollY
      const doc = document.documentElement;
      const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
      // window.scrollTo(0, offsetBottom);
      window.scrollTo(0, top + offsetBottom + 50);
    }
    // `window.scrollTo`({
    //   top: box!.offsetTop,
    //   behavior: "smooth",
    // });
    console.log("window.scrollY", window.scrollY);
    const doc = document.documentElement;
    const top = (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
    console.log("window.pageYOffset", top);

    const stopScroll = (event: UIEvent): void => {
      // const elm = codeRef.current!.parentElement!.parentElement;
      // console.log("window scrolled", isScrolledIntoView(elm));
      if (stopScrolling) {
        event.preventDefault();
        window.scrollTo(0, top);
        // not supported by some browsers
        // window.scrollTo({
        //   top: top,
        // });
      }
    };

    window.addEventListener("scroll", stopScroll);

    return () => {
      window.removeEventListener("scroll", stopScroll);
      // if (stopScrolling) {
      //   // const elm = isReplay ? box!.previousSibling : box!.parentElement;
      //   const elm = box!.parentElement;
      //   elm &&
      //     window.scrollTo({
      //       // top: elm!.offsetTop,
      //       top: top,
      //       behavior: "smooth",
      //     });
      // }
    };
  }, []);

  useEffect(() => {
    console.log("editor useEffect");
  });

  return (
    <Container ref={codeRef}>
      <div className="code-snippet">
        <strong>Code Snippet</strong>
        <label>
          Starting Line:
          <input
            disabled={isReplay}
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
        className="form-control comment-text"
        id="editor"
        name="editor"
        rows={5}
        cols={60}
        placeholder="Leave a comment"
        value={text}
        onChange={textChange}
      />
      <div className="btn-box">
        <MyButton
          variant="form"
          className="btn"
          onClick={() => {
            submitForm({ cancel: true });
          }}
        >
          Cancel
        </MyButton>
        <MyButton
          variant="form"
          {...(textTrimmed ? "" : "disabled")}
          className={`primary ${text ? "" : "disabled"}`}
          onClick={() => {
            if (textTrimmed) {
              // const box = codeRef.current!.parentElement!.parentElement;
              // const height = box!.getBoundingClientRect().height;
              // box!.style.setProperty("height", `${height}px`);

              // box!.classList.add("animate");
              // console.log(box!.style);
              stopScrolling = true;
              submitForm({
                startingLineNum: parseInt(start, 10),
                endingLineNum: parseInt(end, 10),
                text: textTrimmed,
              });
            }
          }}
        >
          Save
        </MyButton>
      </div>
    </Container>
  );
};
