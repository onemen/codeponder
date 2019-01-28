import { BlueInput, Icon, IconProps, styled } from "@codeponder/ui";
import { Field } from "formik";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CommentInputField } from "../../modules/shared/formik-fields/CommentInputField";
import { loadLanguagesForMarkdown, MarkdownPreview } from "./MarkdownPreview";

interface FormInputProps {
  minHeight?: string;
  width?: string;
}

export const FormInput = styled(BlueInput)`
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

  /* hide spinners on number input field */
  &[type="number"]::-webkit-inner-spin-button,
  &[type="number"]::-webkit-outer-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  &[type="number"] {
    -moz-appearance: textfield;
  }
`;

const NavTab = styled.button`
  appearance: none;
  background-color: transparent;
  border: 1px solid transparent;
  border-bottom: 0;
  color: #586069;
  cursor: pointer;
  display: inline-block;
  font-size: 1.4rem;
  line-height: 1.5;
  padding: 0.8rem 1.2rem;
  text-decoration: none;
  user-select: none;
  white-space: nowrap;

  &.selected {
    background-color: #ffffff;
    border-color: #d1d5da;
    border-radius: 3px 3px 0 0;
    color: #24292e;
  }
`;

const EditorContainer = styled.div`
  border-radius: inherit;

  & .editor-header {
    background-color: #f6f8fa;
    border-top-left-radius: inherit;
    border-top-right-radius: inherit;
    border-bottom: 1px solid #d1d5da;
    padding: 1rem 0.9rem 0 0.9rem;
    margin-bottom: 1rem;
    position: relative;

    & .editor-header-tabs {
      margin-bottom: -1px;
    }
  }

  & .write-content,
  & .preview-content {
    background-color: #ffffff;
    display: none;
    margin: 0 1rem;
  }

  & .write-content.selected,
  & .preview-content.selected {
    display: block;
  }

  & .preview-content {
    border-bottom: 1px solid #d1d5da88;
    padding: 0.8rem;

    /* move this part to a separate style */
    & ol,
    & ul,
    & dl {
      padding-left: 1.5em;
    }
  }

  & .write-content textarea {
    border: 1px solid #d1d5da88;
    min-height: 100px;
    padding: 0.8rem;
  }
`;

const Toolbar = styled.div`
  float: right;

  .toolbar-group {
    display: inline-block;
    margin-left: 20px;

    & :first-child {
      margin-left: 0;
    }
  }

  & .toolbar-item {
    background: none;
    border: 0;
    color: #586069;
    display: block;
    float: left;
    padding: 4px 5px;

    :hover {
      color: #0366d6;
    }
  }

  & .tooltipped {
    position: relative;
    z-index: 10;

    ::before {
      border: 6px solid transparent;
      color: #1b1f23;
      content: "";
      display: none;
      height: 0;
      opacity: 0;
      pointer-events: none;
      position: absolute;
      width: 0;
      z-index: 1000001;
    }

    ::after {
      background: #1b1f23;
      border-radius: 3px;
      color: #fff;
      content: attr(aria-label);
      display: none;
      font: normal normal 11px/1.5 -apple-system, BlinkMacSystemFont, Segoe UI,
        Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji,
        Segoe UI Symbol;
      letter-spacing: normal;
      opacity: 0;
      padding: 0.5em 0.75em;
      pointer-events: none;
      position: absolute;
      text-align: center;
      text-decoration: none;
      text-shadow: none;
      text-transform: none;
      white-space: pre;
      word-wrap: break-word;
      z-index: 1000000;
    }

    :active::after,
    :active::before,
    :focus::after,
    :focus::before,
    :hover::after,
    :hover::before {
      animation-delay: 0.4s;
      animation-duration: 0.1s;
      animation-fill-mode: forwards;
      animation-name: tooltip-appear;
      animation-timing-function: ease-in;
      display: inline-block;
      text-decoration: none;
    }
  }

  @keyframes tooltip-appear {
    0% {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  & .tooltipped-n::before,
  & .tooltipped-ne::before,
  & .tooltipped-nw::before {
    border-top-color: #1b1f23;
    bottom: auto;
    margin-right: -6px;
    right: 50%;
    top: -7px;
  }

  & .tooltipped-n::after,
  & .tooltipped-n::after,
  & .tooltipped-s::after {
    transform: translateX(50%);
  }

  & .tooltipped-n::after,
  & .tooltipped-ne::after,
  & .tooltipped-nw::after {
    bottom: 100%;
    margin-bottom: 6px;
    right: 50%;
  }

  & .tooltipped-nw::after {
    right: -30%;
  }
`;

const getPanelForTab = (container: HTMLDivElement, tab: HTMLButtonElement) =>
  container.querySelector(`.${tab.dataset.content}`) as HTMLDivElement;

interface EditorComponentProps {
  isReply: boolean;
  text: string;
}

type ActionMap = {
  [key: string]: {
    before: string;
    after?: string;
    newLine?: string;
    multiple?: true;
  };
};

let isIE8 = false;

export const EditorComponent: React.FC<EditorComponentProps> = ({
  isReply,
  text,
}) => {
  const writeRef = useRef<HTMLInputElement>(null);
  const markdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(false);

  const textTrimmed = text.trim();

  const onTabClick = useCallback(
    async e => {
      const target = e.currentTarget as HTMLButtonElement;
      const container = containerRef.current!;
      const current = container.querySelector(".selected") as HTMLButtonElement;
      if (!current) return;
      const currentPanel = getPanelForTab(container, current);
      const targetPanel = getPanelForTab(container, target);

      // update markdown preview
      const isPreView = target.dataset.content == "preview-content";
      if (isPreView) {
        const height = currentPanel.getBoundingClientRect().height;
        targetPanel.style.minHeight = `${height}px`;

        await loadLanguagesForMarkdown(textTrimmed);
      }
      setPreview(isPreView);

      currentPanel.classList.remove("selected");
      current.classList.remove("selected");
      current.removeAttribute("aria-selected");

      targetPanel.classList.add("selected");
      target.classList.add("selected");
      target.setAttribute("aria-selected", "true");
    },
    [text]
  );

  // TODO: add shortcut key like in github
  const actionMap: ActionMap = {
    header_text: { before: "### " },
    bold_text: { before: "**", after: "**" },
    italic_text: { before: "_", after: "_" },
    insert_quote: { before: "> ", newLine: "\n", multiple: true },
    insert_code: { before: "`", after: "`" },
    insert_link: { before: "[", after: "](url)" },
    bulleted_list: { before: "- ", newLine: "\n", multiple: true },
    numbered_list: { before: "%. ", newLine: "\n", multiple: true },
    task_list: { before: "- [ ] ", newLine: "\n", multiple: true },
    mention_user: { before: "" },
    reference: { before: "" },
  };

  const updateTextValue = (
    text: string,
    selectionStart: number,
    selectionEnd: number
  ) => {
    const textarea = writeRef.current!;
    textarea.value = text;
    textarea.selectionStart = selectionStart;
    textarea.selectionEnd = selectionEnd;
    textarea.focus();
    textarea.style.height = textarea.scrollHeight + 2 + "px";
  };

  useLayoutEffect(() => {
    const textarea = writeRef.current!;
    // textarea selectionStart and selectionEnd does not exist on IE8
    isIE8 =
      typeof textarea.selectionStart !== "number" ||
      typeof textarea.selectionEnd !== "number";
  }, []);

  const onClick = useCallback((e: any) => {
    const textarea = writeRef.current!;
    const text = textarea.value;
    const action: string = e.currentTarget.dataset.click;
    let { before, after = "", newLine = "", multiple = false } = actionMap[
      action
    ];

    const start = textarea.selectionStart || 0;
    const end = textarea.selectionEnd || 0;
    const length = text.length;

    if (start == length) {
      // const before_ = start == 0 ? before : newLine + newLine + before;
      // const newText = text + before_ + after;
      // updateTextValue(newText, start + before_.length, end + before_.length);
      // return;
      const newLineBefore = start == 0 ? "" : newLine + newLine;
      const offset = (newLineBefore + before).length;
      const newText = text + newLineBefore + before.replace(/%/, "1") + after;
      updateTextValue(newText, start + offset, end + offset);
      return;
    }

    let startIndex, endIndex;
    if (start === end) {
      const textStart = text.substring(0, start);
      const lineStart = textStart.lastIndexOf("\n") + 1;
      const sectionStart = textStart.lastIndexOf(" ") + 1;
      startIndex = Math.max(lineStart, sectionStart);
      const textEnd = text.substring(end) + "\n ";
      const lineEnd = textEnd.indexOf("\n");
      const sectionEnd = textEnd.indexOf(" ");
      endIndex = end + Math.min(lineEnd, sectionEnd);
      // console.log(end, endIndex, `"${textEnd}"`, lineEnd, sectionEnd);
    } else {
      startIndex = start;
      endIndex = end;
    }

    // console.log(
    //   `"${text.substring(0, startIndex)}"\n`,
    //   `"${text.substring(startIndex, endIndex)}"\n`,
    //   `"${text.substring(endIndex)}"\n`
    // );

    // TODO: fix insert_quote insert_code and list for the case user selected
    // multiple rows

    // TODO: fix for insert_code for the case user selected multiple rows

    const first = text.substring(0, startIndex);
    const selection = text.substring(startIndex, endIndex);
    const rows = selection.split("\n");
    const last = text.substring(endIndex);

    if (action == "insert_code" && rows.length > 1) {
      before = "```\n";
      after = "\n```";
    }

    // const before_ =
    //   (startIndex == 0
    //     ? ""
    //     : newLine + (first[first.length - 1] == newLine ? "" : newLine)) +
    //   before;

    // const after_ =
    //   after +
    //   (endIndex == length ? "" : newLine + (last[0] == newLine ? "" : newLine));

    const newLineBefore =
      startIndex == 0
        ? ""
        : newLine + (first[first.length - 1] == newLine ? "" : newLine);

    const newLineAfter =
      endIndex == length ? "" : newLine + (last[0] == newLine ? "" : newLine);

    const offset = (newLineBefore + before).length;

    const middle = multiple
      ? rows
          .map((row, index) => before.replace(/%/, `${index + 1}`) + row)
          .join("\n")
      : before + selection;

    // const startText =
    //   first +
    //   newLineBefore +
    //   before +
    //   (multiple ? rows.join("\n" + before) : selection);
    const startText = first + newLineBefore + middle;
    const newText = startText + after + newLineAfter + last;

    if (action == "insert_link") {
      updateTextValue(newText, startText.length + 2, startText.length + 5);
    } else {
      updateTextValue(
        newText,
        // start + (multiple && rows.length > 1 ? 0 : before_.length),
        // end + before_.length * (multiple ? rows.length : 1)
        start + (multiple && rows.length > 1 ? 0 : offset),
        end + offset * (multiple ? rows.length : 1)
      );
    }
  }, []);

  // dynamically set textarea height
  useEffect(() => {
    if (writeRef.current) {
      writeRef.current.style.height = "100px";
      writeRef.current.style.height = writeRef.current!.scrollHeight + 2 + "px";
    }
  }, [text]);

  return (
    <EditorContainer ref={containerRef}>
      <div className="editor-header">
        {!preview && !isIE8 && (
          <Toolbar>
            <div className="toolbar-group">
              <EditorButton
                onClick={onClick}
                label="Add header text"
                data-click="header_text"
              />
              <EditorButton
                onClick={onClick}
                label="Add bold text"
                data-click="bold_text"
              />
              <EditorButton
                onClick={onClick}
                label="Add italic text"
                data-click="italic_text"
              />
            </div>
            <div className="toolbar-group">
              <EditorButton
                onClick={onClick}
                label="Insert a quote"
                data-click="insert_quote"
              />
              <EditorButton
                onClick={onClick}
                label="Insert code"
                data-click="insert_code"
              />
              <EditorButton
                onClick={onClick}
                label="Add a link <ctrl+k>"
                data-click="insert_link"
              />
            </div>
            <div className="toolbar-group">
              <EditorButton
                onClick={onClick}
                label="Add a bulleted list"
                data-click="bulleted_list"
              />
              <EditorButton
                onClick={onClick}
                label="Add a numbered list"
                data-click="numbered_list"
              />
              <EditorButton
                onClick={onClick}
                label="Add a task list"
                data-click="task_list"
              />
            </div>
            {/*
            <div className="toolbar-group">
              <EditorButton
                onClick={onClick}
                className="tooltipped-nw"
                label="Directly mention a user or team"
                data-click="mention_user"
              />
              <EditorButton
                onClick={onClick}
                className="tooltipped-nw"
                label="Reference an issue or pull request"
                data-click="reference"
              />

              <EditorButton label="Insert a reply" data-click="insert_reply" />
              <EditorButton label="Select a reply" data-click="select_reply" />
            </div>
            */}
          </Toolbar>
        )}
        <nav className="editor-header-tabs">
          <NavTab
            type="button"
            className="selected"
            data-content="write-content"
            aria-selected="true"
            onClick={onTabClick}
          >
            Write
          </NavTab>
          <NavTab
            type="button"
            data-content="preview-content"
            onClick={onTabClick}
          >
            Preview
          </NavTab>
        </nav>
      </div>
      <div className="write-content selected">
        <Field
          inputRef={writeRef}
          component={CommentInputField}
          autoFocus={isReply}
          minHeight="100px"
          name="text"
          placeholder={isReply ? "Type your Reply" : "Type your Question"}
          as="textarea"
        />
      </div>
      <div ref={markdownRef} className="preview-content markdown-body">
        {preview && (
          <MarkdownPreview
            source={textTrimmed ? textTrimmed : "Nothing to preview"}
          />
        )}
      </div>
    </EditorContainer>
  );
};

interface EditorButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
  "data-click": IconProps["name"];
}

const EditorButton = ({
  label,
  "data-click": dataClick,
  className = "tooltipped-n",
  onClick,
}: EditorButtonProps) => {
  const baseClass = "toolbar-item tooltipped";
  return (
    <button
      className={className ? `${className} ${baseClass}` : baseClass}
      aria-label={label}
      data-click={dataClick}
      onClick={onClick}
    >
      <Icon size={16} name={dataClick} fill="currentColor" />
    </button>
  );
};
