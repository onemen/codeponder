import { Icon, IconProps, styled } from "@codeponder/ui";
import React, { createContext, useContext } from "react";

const ToolbarContainer = styled.div`
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

type ActionMap = {
  [key: string]: {
    label: string;
    className?: string;
    before: string;
    after?: string;
    newLine?: string;
    multiple?: true;
  };
};

const onButtonClick = (
  textarea: HTMLInputElement,
  textChange: (e: any) => void,
  name: string
) => {
  const updateTextValue = (
    text: string,
    selectionStart: number,
    selectionEnd: number
  ) => {
    textChange({ target: { name: "text", value: text } });
    textarea.selectionStart = selectionStart;
    textarea.selectionEnd = selectionEnd;
    textarea.focus();
    textarea.style.height = textarea.scrollHeight + 2 + "px";
  };

  const text = textarea.value;
  let { before, after = "", newLine = "", multiple = false } = actionMap[name];

  const start = textarea.selectionStart || 0;
  const end = textarea.selectionEnd || 0;
  const length = text.length;

  if (start == length) {
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
  } else {
    startIndex = start;
    endIndex = end;
  }

  const first = text.substring(0, startIndex);
  const selection = text.substring(startIndex, endIndex);
  const rows = selection.split("\n");
  const last = text.substring(endIndex);

  if (name == "insert_code" && rows.length > 1) {
    before = "```\n";
    after = "\n```";
  }

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

  const startText = first + newLineBefore + middle;
  const newText = startText + after + newLineAfter + last;

  if (name == "insert_link") {
    updateTextValue(newText, startText.length + 2, startText.length + 5);
  } else {
    updateTextValue(
      newText,
      start + (multiple && rows.length > 1 ? 0 : offset),
      end + offset * (multiple ? rows.length : 1)
    );
  }
};

// TODO: add shortcut key like in github
const actionMap: ActionMap = {
  header_text: { label: "Add header text", before: "### " },
  bold_text: { label: "Add bold text", before: "**", after: "**" },
  italic_text: { label: "Add italic text", before: "_", after: "_" },
  insert_quote: {
    label: "Insert a quote",
    before: "> ",
    newLine: "\n",
    multiple: true,
  },
  insert_code: { label: "Insert code", before: "`", after: "`" },
  insert_link: { label: "Add a link <ctrl+k>", before: "[", after: "](url)" },
  bulleted_list: {
    label: "Add a bulleted list",
    before: "- ",
    newLine: "\n",
    multiple: true,
  },
  numbered_list: {
    label: "Add a numbered list",
    before: "%. ",
    newLine: "\n",
    multiple: true,
  },
  task_list: {
    label: "Add a task list",
    before: "- [ ] ",
    newLine: "\n",
    multiple: true,
  },
  mention_user: {
    label: "Directly mention a user or team",
    className: "tooltipped-nw",
    before: "",
  },
  reference: {
    label: "Reference an issue or pull request",
    className: "tooltipped-nw",
    before: "",
  },
};

const EditorButton: React.FC<{ name: IconProps["name"] }> = ({ name }) => {
  const { writeRef, textChange } = useContext(ToolbarContext);
  const { label, className = "tooltipped-n" } = actionMap[name];
  const baseClass = "toolbar-item tooltipped";

  return (
    <button
      className={className ? `${className} ${baseClass}` : baseClass}
      aria-label={label}
      onClick={() => onButtonClick(writeRef.current!, textChange, name)}
    >
      <Icon size={16} name={name} fill="currentColor" />
    </button>
  );
};

export const Toolbar: React.FC = () => {
  return (
    <ToolbarContainer>
      <div className="toolbar-group">
        <EditorButton name="header_text" />
        <EditorButton name="bold_text" />
        <EditorButton name="italic_text" />
      </div>
      <div className="toolbar-group">
        <EditorButton name="insert_quote" />
        <EditorButton name="insert_code" />
        <EditorButton name="insert_link" />
      </div>
      <div className="toolbar-group">
        <EditorButton name="bulleted_list" />
        <EditorButton name="numbered_list" />
        <EditorButton name="task_list" />
      </div>
    </ToolbarContainer>
  );
};

type ToolbarProps = {
  writeRef: React.RefObject<HTMLInputElement>;
  textChange: (e: any) => void;
};

export const ToolbarContext = createContext<ToolbarProps>({} as any);
