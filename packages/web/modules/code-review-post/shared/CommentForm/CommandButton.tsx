import { Icon, IconProps } from "@codeponder/ui";
import React, { useContext } from "react";
import { commands } from "./commands";
import { ToolbarContext } from "./Toolbar";

const updateTextForCommand = (
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
  let { before, after = "", newLine = "", multiple = false } = commands[name];

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

export const CommandButton: React.FC<{
  name: IconProps["name"];
}> = ({ name }) => {
  const { writeRef, textChange } = useContext(ToolbarContext);
  const { label, className = "tooltipped-n" } = commands[name];
  const baseClass = "toolbar-item tooltipped";
  return (
    <button
      className={className ? `${className} ${baseClass}` : baseClass}
      aria-label={label}
      onClick={() => updateTextForCommand(writeRef.current!, textChange, name)}
    >
      <Icon size={16} name={name} fill="currentColor" />
    </button>
  );
};
