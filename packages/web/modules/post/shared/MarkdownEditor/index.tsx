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
import { commandsHandler, keyBoardCommands } from "./commands";
import { loadLanguagesForMarkdown, MarkdownPreview } from "./Preview";
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
    border: 1px solid transparent;
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

export const MarkdownEditor: React.FC<EditorProps> = React.memo(
  ({ isReply, text, textChange }) => {
    const writeRef = useRef<HTMLTextAreaElement>(null);
    const [tab, setTab] = useState<Tab>("write");

    const handleTabChange = useCallback(async (newTab: Tab) => {
      if (newTab === "write") {
        await setTab("write");
        writeRef.current!.focus();
      } else {
        await loadLanguagesForMarkdown(writeRef.current!.value.trim());
        setTab("preview");
      }
    }, []);

    const handleCommand = useCallback((name: string) => {
      commandsHandler(name, writeRef.current!, textChange);
    }, []);

    const handleKeyCommand = useCallback((e: React.KeyboardEvent) => {
      const command = !isIE8 && keyBoardCommands(e);
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
      <EditorContainer>
        <Toolbar
          tab={tab}
          isIE8={isIE8}
          onCommand={handleCommand}
          handleTabChange={handleTabChange}
        />
        <div className={`${tab === "write" ? "selected " : ""}write-content`}>
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
        {tab === "preview" && (
          <div
            className="preview-content markdown-body selected"
            style={{
              minHeight: writeRef.current!.style.height || "100px",
            }}
          >
            <MarkdownPreview source={text.trim() || "Nothing to preview"} />
          </div>
        )}
      </EditorContainer>
    );
  }
);
