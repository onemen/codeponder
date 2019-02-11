import { styled } from "@codeponder/ui";
import { Field } from "formik";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CommentInputField } from "../../../shared/formik-fields/CommentInputField";
import { loadLanguagesForMarkdown, MarkdownPreview } from "../MarkdownPreview";
import { executeCommand, keyCommands } from "./commands";
import { Toolbar } from "./Toolbar";

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
    line-height: 1;

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
    resize: vertical;
  }
`;

const getPanelForTab = (container: HTMLDivElement, tab: HTMLButtonElement) =>
  container.querySelector(`.${tab.dataset.content}`) as HTMLDivElement;

interface EditorProps {
  isReply: boolean;
  text: string;
  textChange: (e: any) => void;
}

let isIE8 = false;

export const Editor: React.FC<EditorProps> = React.memo(
  ({ isReply, text, textChange }) => {
    const writeRef = useRef<HTMLTextAreaElement>(null);
    const markdownRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [preview, setPreview] = useState(false);

    const textTrimmed = text.trim();

    const handleTabChange = useCallback(
      async e => {
        const target = e.currentTarget as HTMLButtonElement;
        const container = containerRef.current!;
        const current = container.querySelector(
          ".selected"
        ) as HTMLButtonElement;
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

    const handleCommand = useCallback((name: string) => {
      const textarea = writeRef.current!;
      const { value: text, selectionStart, selectionEnd } = textarea;
      const { newText, start, end } = executeCommand(
        name,
        text,
        selectionStart,
        selectionEnd
      );

      textChange({ target: { name: "text", value: newText } });
      textarea.selectionStart = start;
      textarea.selectionEnd = end;
      textarea.focus();
      textarea.style.height = textarea.scrollHeight + 2 + "px";
    }, []);

    const handleKeyCommand = useCallback((e: React.KeyboardEvent) => {
      const command = keyCommands(e);
      if (command) {
        handleCommand(command);
        e.preventDefault();
      }
    }, []);

    useLayoutEffect(() => {
      const textarea = writeRef.current!;
      // textarea selectionStart and selectionEnd does not exist on IE8
      isIE8 =
        typeof textarea.selectionStart !== "number" ||
        typeof textarea.selectionEnd !== "number";
    }, []);

    // dynamically set textarea height
    useEffect(() => {
      const textarea = writeRef.current!;
      textarea.style.height = "100px";
      textarea.style.height = writeRef.current!.scrollHeight + 2 + "px";
    }, [text]);

    return (
      <EditorContainer ref={containerRef}>
        <div className="editor-header">
          {!preview && !isIE8 && <Toolbar onCommand={handleCommand} />}
          <nav className="editor-header-tabs">
            <NavTab
              type="button"
              className="selected"
              data-content="write-content"
              aria-selected="true"
              onClick={handleTabChange}
            >
              Write
            </NavTab>
            <NavTab
              type="button"
              data-content="preview-content"
              onClick={handleTabChange}
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
            onKeyDown={handleKeyCommand}
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
  }
);
