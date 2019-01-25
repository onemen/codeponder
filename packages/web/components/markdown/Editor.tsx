import { BlueInput, styled, Icon } from "@codeponder/ui";
import { Field } from "formik";
import React, { useCallback, useRef, useState } from "react";
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
  }

  & .tooltipped::before {
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

  & .tooltipped::after {
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

  & .tooltipped:active::after,
  & .tooltipped:active::before,
  & .tooltipped:focus::after,
  & .tooltipped:focus::before,
  & .tooltipped:hover::after,
  & .tooltipped:hover::before {
    animation-delay: 0.4s;
    animation-duration: 0.1s;
    animation-fill-mode: forwards;
    animation-name: tooltip-appear;
    animation-timing-function: ease-in;
    display: inline-block;
    text-decoration: none;
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
`;

const getPanelForTab = (container: HTMLDivElement, tab: HTMLButtonElement) =>
  container.querySelector(`.${tab.dataset.content}`) as HTMLDivElement;

interface EditorComponentProps {
  isReply: boolean;
  text: string;
}

export const EditorComponent: React.FC<EditorComponentProps> = ({
  isReply,
  text,
}) => {
  const markdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [preview, setPreview] = useState(false);

  const textTrimmed = text.trim();

  const onTabClick = useCallback(
    async e => {
      const target = e.target as HTMLButtonElement;
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

  return (
    <EditorContainer ref={containerRef}>
      <div className="editor-header">
        <Toolbar style={{}}>
          <div className="toolbar-group">
            <button
              className="toolbar-item tooltipped tooltipped-n"
              aria-label="Add header text"
            >
              <Icon size={16} name="header_text" fill="currentColor" />
            </button>
            <button>AAA</button>
            <button>AAA</button>
            <button>AAA</button>
            <button>AAA</button>
          </div>
        </Toolbar>
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
      <div
        className="write-content selected"
        ref={elm =>
          elm && isReply && (elm.firstChild as HTMLInputElement).focus()
        }
      >
        <Field
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
