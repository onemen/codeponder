import React, { useCallback, useRef, useEffect } from "react";

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
    border: 1px solid #2188ff;
    box-shadow: inset 0 1px 2px rgba(27, 31, 35, 0.075),
      0 0 0 0.2em rgba(3, 102, 214, 0.3);
  }

  /* hide spinners on number input filed */
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

const FormContainer = styled.div`
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

interface CodeElement extends Element {
  setStartingLineNum: (val?: number) => void;
}

export const TextEditor = (props: TextEditorProps) => {
  const { isReplay, startingLineNum, endingLineNum, submitForm, type } = props;

  const formRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const startInput = useRef<HTMLInputElement>(null);
  const endInput = useRef<HTMLInputElement>(null);

  const [title, titleChange] = useInputValue("");
  const [start, startingLineNumChange] = useInputValue(
    startingLineNum || endingLineNum
  );
  const [end, endingLineNumChange] = useInputValue(endingLineNum);
  const [text, textChange] = useInputValue("");

  const titleTrimmed = (() => title.trim())();
  const textTrimmed = (() => text.trim())();
  const isValidForm = titleTrimmed && textTrimmed;

  // console.log("start", start);

  // focus title / textarea
  useEffect(() => {
    if (inputRef) {
      inputRef.current!.focus();
    }
  }, []);

  // highlight selected lines
  useEffect(() => {
    const parentElm: CodeElement | null = document.querySelector(
      ".code-content"
    );
    if (startInput.current && parentElm) {
      const onMouseDown = () => {
        // console.log("onMouseDown");
        // const list: NodeListOf<HTMLTableCellElement> = parentElm.querySelectorAll(
        //   ".is-hovered"
        // );
        // list.forEach(td => td.classList.toggle("is-hovered", false));
      };
      const onFocus = () => {
        // console.log("onFocus", { startingLineNum, endingLineNum, parentElm });
        startInput.current!.addEventListener("blur", onBlur);
        parentElm.classList.add("js-select-line");
        // parentElm.setAttribute("data-ending-line-num", end);
        // parentElm.setAttribute("data-selected-range", `${start}-${end}`);

        /*         const numberElm: HTMLElement | null = parentElm.querySelector(
          `[data-line-number="${end}"]`
        );
        if (numberElm && numberElm.parentNode) {
          const f = numberElm.parentNode;
          numberElm.parentNode.classList.add("is-selected");
        } */

        // parentElm.setStartingLineNum = (val?: number) => {
        //   startingLineNumChange({ currentTarget: { value: val } });
        // };
        parentElm.addEventListener("mousedown", onMouseDown);
        parentElm.addEventListener("mouseout", onMouseOverOrOut);
        parentElm.addEventListener("mouseover", onMouseOverOrOut);
        // parentElm.firstChild!.addEventListener(
        //   "mouseout",
        //   e => {
        //     e.preventDefault();
        //     console.log("commentForm onmouseout");
        //   },
        //   true
        // );
        // parentElm.firstChild!.addEventListener(
        //   "mouseover",
        //   e => {
        //     e.preventDefault();
        //     console.log("commentForm onmouseover");
        //   },
        //   true
        // );
      };
      const onBlur = () => {
        // console.log("onBlur", { startingLineNum, endingLineNum });
        startInput.current!.removeEventListener("blur", onBlur);
        parentElm.classList.remove("js-select-line");
        // parentElm.removeAttribute("data-ending-line-num");
        // parentElm.removeAttribute("data-selected-range");
        // parentElm.setStartingLineNum = () => {};
        parentElm.removeEventListener("mousedown", onMouseDown);
        parentElm.removeEventListener("mouseout", onMouseOverOrOut);
        parentElm.removeEventListener("mouseover", onMouseOverOrOut);
      };
      startInput.current!.addEventListener("focus", onFocus);
      return () => {
        startInput.current!.removeEventListener("focus", onFocus);
        onBlur();
      };
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

  useEffect(
    () => {
      const input = startInput!.current!;
      // console.log("start", start);
      const parentElm: TreeElement | null = document.querySelector(
        ".code-content"
      );
      if (parentElm) {
        const currentLine = input.validity.valid ? input.value : end;
        let numberElm = parentElm.querySelector(
          `[data-line-number="${currentLine}"]`
        ) as TreeElement;
        if (numberElm) {
          // selectRange(parentElm, numberElm as TreeElement, -1, end);
          // const currentLine = Number(numberElm.dataset.lineNumber);
          // if (currentLine != start && currentLine <= end) {
          if (currentLine <= end) {
            toggleClassForList(parentElm, "is-selected");
            while (numberElm && Number(numberElm.dataset.lineNumber) <= end) {
              numberElm.parentNode.classList.add("is-selected");
              numberElm = numberElm.parentNode.nextSibling.childNodes[0];
              // console.log(numberElm, numberElm.dataset.lineNumber);
            }
          }
        }
      }
    },
    [start]
  );

  // close editor with Esc if user did not start editing
  const onKeyDown = useCallback(({ keyCode }: any) => {
    if (keyCode == 27 && !textTrimmed) {
      submitForm({ cancel: true } as TextEditorResult);
    }
  }, []);

  const onMouseOverOrOut = useCallback((e: any) => {
    const startVal = +startInput.current!.value;
    const endVal = +endInput.current!.value;
    setIsHovered(e, startVal, endVal, startingLineNumChange);
  }, []);

  return (
    <CommentBoxContainer>
      <FormContainer ref={formRef} onKeyDown={onKeyDown}>
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
                ref={startInput}
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
                ref={endInput}
                /*TODO enable the input on other page */
                disabled
                name="endingLineNum"
                value={end}
                width="5em"
                /*TODO add min max for the case the form is on other page */
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
                  startingLineNum: start,
                  endingLineNum: end,
                  title: titleTrimmed,
                  text: textTrimmed,
                });
              }
            }}
          >
            Save
          </MyButton>
        </div>
      </FormContainer>
    </CommentBoxContainer>
  );
};

const toggleClassForList = (parent: Element, selector: string): void => {
  parent
    .querySelectorAll(`.${selector}`)
    .forEach(elm => elm.classList.toggle(selector, false));
};

// interface setIsHoveredProps {
//   e: any;
//   start: number;
//   end: number;
//   startingLineNumChange: (e: any) => void;
// }

// const setIsHovered = ({ target: elm, currentTarget: parent, type }: any) => {
const setIsHovered = (
  { target: elm, currentTarget: parent, type }: any,
  start: number,
  end: number,
  startingLineNumChange: (e: any) => void
) => {
  // console.log("commentForm setIsHovered");
  while (elm && elm != parent && !elm.classList.contains("token-line")) {
    elm = elm.parentNode || null;
  }
  if (elm && parent) {
    let isOverLine =
      type == "mouseover" && elm.classList.contains("token-line");

    let numberElm = elm.childNodes[0];
    const currentLine = +numberElm.dataset.lineNumber;

    if (isOverLine) {
      // const selectedRange: string = parent.dataset.selectedRange;
      // const [start, end] = selectedRange.split("-").map(val => +val);
      console.log({
        test: currentLine != start && currentLine <= end,
        start,
        end,
        currentLine,
      });
      if (currentLine != start && currentLine <= end) {
        // toggleClassForList(parent, "is-selected");
        // startingLineNumChange(currentLine);
        startingLineNumChange({ currentTarget: { value: currentLine } });
        // parent.setAttribute("data-selected-range", `${currentLine}-${end}`);
        // while (numberElm && numberElm.dataset.lineNumber <= end) {
        //   numberElm.parentNode.classList.add("is-selected");
        //   numberElm = numberElm.parentNode.nextSibling.childNodes[0];
        // }
      }
    }
  }
};

interface TreeElement extends HTMLElement {
  parentNode: TreeElement;
  childNodes: NodeListOf<TreeElement>;
  classList: DOMTokenList;
  nextSibling: TreeElement;
}

const selectRange = (
  parent: TreeElement,
  numberElm: TreeElement,
  start: number,
  end: number
): void => {
  const currentLine = Number(numberElm.dataset.lineNumber);
  if (currentLine != start && currentLine <= end) {
    toggleClassForList(parent, "is-selected");
    while (numberElm && Number(numberElm.dataset.lineNumber) <= end) {
      numberElm.parentNode.classList.add("is-selected");
      numberElm = numberElm.parentNode.nextSibling.childNodes[0];
      // console.log(numberElm, numberElm.dataset.lineNumber);
    }
  }
};
