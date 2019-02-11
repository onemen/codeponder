type CommandsMap = {
  [key: string]: {
    label: string;
    className?: string;
    before: string;
    after?: string;
    newLine?: string;
    multiple?: true;
  };
};

// TODO: add shortcut key like in github
export const commands: CommandsMap = {
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
