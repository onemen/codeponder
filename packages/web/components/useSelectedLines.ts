import { useEffect } from "react";

interface TreeElement extends HTMLElement {
  parentNode: TreeElement;
  childNodes: NodeListOf<TreeElement>;
  classList: DOMTokenList;
  nextSibling: TreeElement;
}

const setIsHovered = (
  { target: elm, currentTarget: parent, type }: any,
  start: number,
  end: number,
  startingLineNumChange: (e: any) => void
) => {
  while (elm && elm != parent && !elm.classList.contains("token-line")) {
    elm = elm.parentNode || null;
  }
  if (elm && parent) {
    let isOverLine =
      type == "mouseover" && elm.classList.contains("token-line");

    let numberElm = elm.childNodes[0];
    const currentLine = +numberElm.dataset.lineNumber;

    if (isOverLine && currentLine != start && currentLine <= end) {
      startingLineNumChange({ currentTarget: { value: currentLine } });
    }
  }
};

export const cleanSelectedLines = (
  parentElm = document.querySelector(".code-content")
) => {
  parentElm!
    .querySelectorAll(".is-selected")
    .forEach(elm => elm.classList.remove("is-selected"));
};

export const useSelectedLines = (
  startInput: React.RefObject<HTMLInputElement>,
  endInput: React.RefObject<HTMLInputElement>,
  start: number,
  startChange: (e: any) => void,
  end: number,
  view: string
) => {
  const parentElm = document.querySelector(".code-content");

  const applyEffect = view == "in-code" && parentElm;

  // listening to mouse move when start input is focused
  useEffect(() => {
    const input = startInput!.current!;
    if (!applyEffect || !input) {
      return;
    }

    const onMouseOverOrOut = (e: any) => {
      const startVal = +input!.value;
      const endVal = +endInput.current!.value;
      setIsHovered(e, startVal, endVal, startChange);
    };
    const onFocus = () => {
      parentElm!.classList.add("js-select-line");
      input!.addEventListener("blur", onBlur);
      parentElm!.addEventListener("mouseout", onMouseOverOrOut);
      parentElm!.addEventListener("mouseover", onMouseOverOrOut);
    };
    const onBlur = () => {
      parentElm!.classList.remove("js-select-line");
      input!.removeEventListener("blur", onBlur);
      parentElm!.removeEventListener("mouseout", onMouseOverOrOut);
      parentElm!.removeEventListener("mouseover", onMouseOverOrOut);
    };

    input!.addEventListener("focus", onFocus);
    return () => {
      input!.removeEventListener("focus", onFocus);
      onBlur();
    };
  }, []);

  // Styles lines between start - end when start change
  useEffect(
    () => {
      const input = startInput!.current!;
      if (!applyEffect || !input) {
        return;
      }

      const currentLine = input.validity.valid ? input.value : end;
      let numberElm = parentElm!.querySelector(
        `[data-line-number="${currentLine}"]`
      ) as TreeElement;
      if (numberElm && currentLine <= end) {
        cleanSelectedLines(parentElm);
        while (numberElm && Number(numberElm.dataset.lineNumber) <= end) {
          numberElm.parentNode.classList.add("is-selected");
          numberElm = numberElm.parentNode.nextSibling.childNodes[0];
        }
      }
    },
    [start]
  );
};
