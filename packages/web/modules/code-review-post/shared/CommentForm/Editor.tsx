import { styled } from "@codeponder/ui";
import classNames from "classnames";
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
import { commandsHandler, keyBoardCommands } from "./commands";
import { Tab, Toolbar } from "./Toolbar";

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

interface EditorProps {
  isReply: boolean;
  text: string;
  textChange: (e: any) => void;
}

let isIE8 = false;

export const Editor: React.FC<EditorProps> = React.memo(
  ({ isReply, text, textChange }) => {
    const writeRef = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<Tab>("write");

    const handleTabChange = useCallback(async (newTab: Tab) => {
      if (newTab === "preview") {
        await loadLanguagesForMarkdown(writeRef.current!.value.trim());
      }
      setTab(newTab);
    }, []);

    const handleCommand = useCallback((name: string) => {
      commandsHandler(name, writeRef.current!, textChange);
    }, []);

    const handleKeyCommand = useCallback((e: React.KeyboardEvent) => {
      const command = keyBoardCommands(e);
      if (!isIE8 && command) {
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
      <EditorContainer>
        <Toolbar
          tab={tab}
          isIE8={isIE8}
          onCommand={handleCommand}
          handleTabChange={handleTabChange}
        />
        <div
          className={classNames("write-content", { selected: tab === "write" })}
        >
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
        <div
          className={classNames("preview-content", "markdown-body", {
            selected: tab === "preview",
          })}
          style={{
            minHeight:
              (writeRef.current && writeRef.current.style.height) || "100px",
          }}
        >
          {tab === "preview" && (
            <MarkdownPreview source={text.trim() || "Nothing to preview"} />
          )}
        </div>
      </EditorContainer>
    );
  }
);
