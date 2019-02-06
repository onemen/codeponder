import { BlueInput, styled } from "@codeponder/ui";
import { Field } from "formik";
import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { CommentInputField } from "../../../shared/formik-fields/CommentInputField";
import { loadLanguagesForMarkdown, MarkdownPreview } from "./MarkdownPreview";
import { Toolbar, ToolbarContext } from "./Toolbar";

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

const getPanelForTab = (container: HTMLDivElement, tab: HTMLButtonElement) =>
  container.querySelector(`.${tab.dataset.content}`) as HTMLDivElement;

interface EditorComponentProps {
  isReply: boolean;
  text: string;
  textChange: (e: any) => void;
}

let isIE8 = false;

export const EditorComponent: React.FC<EditorComponentProps> = ({
  isReply,
  text,
  textChange,
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
        {!preview && !isIE8 && (
          <ToolbarContext.Provider value={{ writeRef, textChange }}>
            <Toolbar />
          </ToolbarContext.Provider>
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