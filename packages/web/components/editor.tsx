import { BlueInput, styled } from "@codeponder/ui";
import { Field } from "formik";
import marked from "marked";
import React, { useCallback, useRef, useState } from "react";
import { CommentInputField } from "../modules/shared/formik-fields/CommentInputField";
import { filenameToLang } from "../utils/filenameToLang";
import { getHighlightedCode } from "../utils/highlightCode";
// import Markdown, { compiler as markdown } from "markdown-to-jsx";
// import "./markdown.css";
import "./github-markdown.css";

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
  & .editor-header {
    background-color: #f6f8fa;
    border-bottom: 1px solid #d1d5da;
    padding: 1rem 0.9rem 0 0.9rem;
    margin-bottom: 1rem;

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

marked.setOptions({
  renderer: new marked.Renderer(),
  highlight: function(code, language, callback) {
    // console.log(callback && callback.toString());
    highlightCode_(code, language, callback);
    return code;
  },
  breaks: true,
  gfm: true,
  langPrefix: "language-",
  mangle: true,
  pedantic: false,
  sanitize: true,
  smartLists: true,
  smartypants: true,
  tables: true,
  xhtml: false,
});

// const markedCallBack = (error: any | undefined, code: string) => {
//   console.log("markedCallBack");
//   return code;
// };

const highlightCode_ = async (
  code: string,
  lang: string,
  callback?: (error: any | undefined, code: string) => void
) => {
  // console.log(lang, callback);
  try {
    const language = filenameToLang(lang);
    // console.log(language, lang);
    const result = await getHighlightedCode(code, language);
    // if (callback) {
    callback && callback(null, result.toString());
    // }
    // return result;
    // return result;
  } catch (err) {
    callback && callback(err, "");
  }
};

const highlightCode = async (code: HTMLElement) => {
  const lang = Array.from(code.classList)
    .filter(item => item.startsWith("language-"))
    .map(className => className.replace("language-", ""))[0];
  if (lang) {
    const language = filenameToLang(lang);
    const html = code.innerHTML.replace(/&gt;/, ">").replace(/&lt;/, "<");
    // console.log(code.innerHTML);
    code.innerHTML = await getHighlightedCode(html, language);
  }
};

const highlightMarkdown = (markdownContainer: HTMLDivElement) => {
  const codeSections = markdownContainer.querySelectorAll("code");
  console.log("codeSections", codeSections);
  if (codeSections.length === 0) return;
  Array.from(codeSections).forEach(highlightCode);
};

interface EditorComponentProps {
  isReply: boolean;
  text: string;
}

export const EditorComponent: React.FC<EditorComponentProps> = ({
  isReply,
  text,
}) => {
  const markDownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // const [preview, setPreview] = useState(false);
  const [markedHtml, setMarkedHtml] = useState("");

  const textTrimmed = text.trim();

  const onTabClick = useCallback(
    e => {
      const target = e.target as HTMLButtonElement;
      const container = containerRef.current!;
      const current = container.querySelector(".selected") as HTMLButtonElement;
      if (!current) return;
      const currentPanel = getPanelForTab(container, current);
      const targetPanel = getPanelForTab(container, target);

      // update preview content
      const isPreView = target.dataset.content == "preview-content";
      if (isPreView) {
        const height = currentPanel.getBoundingClientRect().height;
        targetPanel.style.minHeight = `${height}px`;

        if (textTrimmed) {
          const renderer = new marked.Renderer();
          renderer.link = (href, title, text) =>
            `<a target="_blank" rel="noopener noreferrer" href="${href}" title="${title}">${text}</a>`;
          marked(
            textTrimmed,
            { renderer },
            (error: any | undefined, code: string) => {
              setMarkedHtml(error ? "" : code);
            }
          );
        }
      }
      // setPreview(isPreView);

      currentPanel.classList.remove("selected");
      current.classList.remove("selected");
      current.removeAttribute("aria-selected");

      targetPanel.classList.add("selected");
      target.classList.add("selected");
      target.setAttribute("aria-selected", "true");
    },
    [text]
  );

  // useEffect(
  //   () => {
  //     if (markDownRef.current) {
  //       highlightMarkdown(markDownRef.current);
  //     }
  //   },
  //   [preview]
  // );

  return (
    <EditorContainer ref={containerRef}>
      <div className="editor-header">
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
      {/*       <div ref={markDownRef} className="preview-content">
        {preview && (textTrimmed ? check(textTrimmed) : "Nothing to preview")}
      </div> */}
      <article
        ref={markDownRef}
        className="preview-content markdown-body"
        dangerouslySetInnerHTML={{
          __html: markedHtml || "Nothing to preview",
        }}
      />
    </EditorContainer>
  );
};
