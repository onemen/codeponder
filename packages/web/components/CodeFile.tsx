import { useRef, useState, useEffect } from "react";
import * as Prism from "prismjs";
import "prismjs/themes/prism-coy.css";
import Highlight, { Token, RenderProps } from "prism-react-renderer";
import { IconButton, styled, css } from "@codeponder/ui";
import { CommentProps, Comments, LineNo, CommentBox } from "./commentUI";

import {
  FindCodeReviewQuestionsComponent,
  FindCodeReviewQuestionsQuery,
  CodeReviewQuestionInfoFragment,
  QuestionReplyInfoFragment,
} from "./apollo-components";
import { filenameToLang } from "../utils/filenameToLang";
import { loadLanguage } from "../utils/loadLanguage";
import {
  CommentSection,
  CommentData,
  CommentSectionProps,
  AddComment,
} from "./CommentSection";

interface Props {
  code: string | null;
  path?: string;
  postId: string;
}
/*
 * *Styles for the line numbers coming from the server
 *
 * TODO: Perhaps refactor SelectLinesMouse as a 'sub function' of SelectLines?
 * Or the two in a more general utils?
 */
const SelectLines = (prop: FindCodeReviewQuestionsQuery) => {
  const styles = prop.findCodeReviewQuestions.reduce((total, current) => {
    return (total += `
     & .token-line:nth-child(n+${current.startingLineNum}):nth-child(-n+${
      current.endingLineNum
    }) {
      background: hsla(24, 20%, 50%,.08);
      background: linear-gradient(to right, hsla(24, 20%, 50%,.1) 70%, hsla(24, 20%, 50%,0));
    }
     `);
  }, "");
  return css`
    ${styles}
  `;
};

const getCommentsForFile = (prop: FindCodeReviewQuestionsQuery): Comments => {
  const comment = ({
    id,
    text,
    creator,
    __typename,
  }:
    | CodeReviewQuestionInfoFragment
    | QuestionReplyInfoFragment): CommentProps => ({
    id,
    text,
    username: creator.username,
    isOwner: true, // Todo: need to get real value
    type: (__typename || "").includes("Reply") ? "reply" : "question",
  });

  return prop.findCodeReviewQuestions.reduce((comments: Comments, props) => {
    const startingLineNum = props.startingLineNum;
    const endingLineNum = props.endingLineNum;
    const key = endingLineNum;
    comments[key] = comments[key] || [];
    comments[key].push({
      startingLineNum,
      endingLineNum,
      ...comment(props),
    });
    props.replies.forEach(reply => comments[key].push(comment(reply)));
    return comments;
  }, {});
};

const insertCommentsToCode = (
  tokens: Token[][],
  data: FindCodeReviewQuestionsQuery
): (Token[] | CommentProps)[] => {
  const comments = getCommentsForFile(data);
  return tokens.reduce((lines: (Token[] | CommentProps)[], line, i) => {
    lines.push(line);
    if (comments[i + 1]) {
      lines.push(...comments[i + 1]);
    }
    return lines;
  }, []);
};

const setIsHovered = (
  { current }: React.RefObject<HTMLElement>,
  { target: elm }: any,
  showButton: boolean
) => {
  while (elm && elm != current && !elm.classList.contains("token-line")) {
    // hide the button when user hover over commets or line-number
    const name = elm.classList[0];
    if (name && name.match(/CommentBoxContainer|LineNo/)) {
      showButton = false;
    }
    elm = elm.parentNode || null;
  }
  if (elm && current) {
    current
      .querySelectorAll(".is-hovered")
      .forEach(button => button.classList.toggle("is-hovered", false));
    if (showButton) {
      elm.childNodes[1].classList.add("is-hovered");
    }
  }
};

const getCommentSection = (props: CommentSectionProps) => {
  const { commentsForFile, line, useEditor } = props;
  const comments = commentsForFile[line];
  if (!comments && useEditor[0] != line) {
    console.log("CommentSection return null");
    return null;
  }
  return <CommentSection {...props} />;
};

interface HighlightProps extends CommentData {
  data: FindCodeReviewQuestionsQuery;
  lang: string;
}

const HighlightCode: React.SFC<HighlightProps> = ({
  code,
  lang,
  data,
  ...props
}) => {
  const hasLoadedLanguage = useRef(false);
  const codeRef = useRef<HTMLElement>(null);
  const [loading, setloading] = useState(true);
  const [showEditor, setShowEditor] = useState(0);

  useEffect(() => {
    console.log("HighlightCode useEffect");
    if (!hasLoadedLanguage.current) {
      loadLanguage(lang)
        .then(() => {
          setloading(false);
          hasLoadedLanguage.current = true;
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    console.log("HighlightCode useEffect", { showEditor, loading });
  });

  if (loading) {
    return null;
  }

  const Pre = styled.pre`
    & code[class*="language-"] {
      padding-left: 0;
      overflow: hidden;
    }

    ${SelectLines(data)};
  `;

  // {/* {({ className, style, tokens, getLineProps, getTokenProps }) => { */ }
  return (
    <Highlight Prism={Prism} code={code} language={lang}>
      {highlightProps => {
        console.log("Highlight component renders");
        if (data) {
          return (
            <HighlightPre
              {...{ ...highlightProps, data, code, lang, ...props }}
            />
          );
        }
        const comments = getCommentsForFile(data);
        const {
          className,
          style,
          tokens,
          getLineProps,
          getTokenProps,
        } = highlightProps;
        return (
          <Pre className={className} style={style}>
            <code
              className={`code-content ${className}`}
              ref={codeRef}
              onMouseOut={(e: any): void => {
                setIsHovered(codeRef, e, false);
              }}
              onMouseOver={(e: any): void => {
                setIsHovered(codeRef, e, true);
              }}
            >
              {tokens.map((line, i) => (
                <div {...getLineProps({ line, key: i })}>
                  <LineNo>{i + 1}</LineNo>
                  <IconButton
                    style={{ margin: "-2px 0px -2px -20px" }}
                    variant="primary"
                    icon="plus"
                    className="hidden"
                    onClick={() => {
                      setShowEditor(i + 1);
                    }}
                  />
                  {line.map((token, key) => (
                    <span {...getTokenProps({ token, key })} />
                  ))}
                  {/*                   <CommentSection
                    {...{
                      commentsForFile: comments,
                      line: i + 1,
                      useEditor: [showEditor, setShowEditor],
                      code,
                      lang,
                      ...props,
                    }}
                  /> */
                  getCommentSection({
                    commentsForFile: comments,
                    line: i + 1,
                    useEditor: [showEditor, setShowEditor],
                    code,
                    lang,
                    ...props,
                  })}
                </div>
              ))}
            </code>
          </Pre>
        );
      }}
    </Highlight>
  );
};

interface X {
  className: string;
  data: FindCodeReviewQuestionsQuery;
  children: Element;
}

const StyledPre = (props: X) => {
  const pre = ({ className, children }: X) => (
    <pre className={className}>{children}</pre>
  );
  const Pre = pre({ ...props });
  return styled(pre)`
    & code[class*="language-"] {
      padding-left: 0;
      overflow: hidden;
    }

    ${p => {
      console.log("in styled component pre");
      return SelectLines(props.data);
    }};
  `;
};

interface HighlightPreProps extends RenderProps, CommentData {
  data: FindCodeReviewQuestionsQuery;
}

interface HighlightRowProps extends CommentData {
  line: Token[];
  useComments: [Comments, React.Dispatch<React.SetStateAction<Comments>>];
  commentsForRow: CommentProps[];
  getLineProps: RenderProps["getLineProps"];
  getTokenProps: RenderProps["getTokenProps"];
  rowNum: number;
}

const HighlightRow: React.SFC<HighlightRowProps> = ({
  line,
  getLineProps,
  getTokenProps,
  rowNum,
  useComments,
  ...props
}) => {
  const [showEditor, setShowEditor] = useState(false);
  const [comments, setCommnets] = useComments;

  const commentsForRow = comments[rowNum] || [];
  console.log("render line", rowNum);
  // console.log("commentsForRow", rowNum, commentsForRow);

  const onReplyClicked = () => {
    console.log("showEditor", rowNum);
    console.log("comments for row", commentsForRow);
    console.log("tokens for row", line);
    setShowEditor(true);
  };

  const onEditorSubmit = async (result: any) => {
    if (result) {
      result.data.username = "John D.";
      result.data.isOwner = false;
      const response = await result.response;
      console.log("mutate response", response);
      console.log("comments for row", commentsForRow, result.data);
      setCommnets({ ...comments, [rowNum]: [...commentsForRow, result.data] });
    }
    setShowEditor(false);
    console.log("result from comment form", result);
  };

  useEffect(
    () => {
      console.log("on useEffect showEditor", showEditor);
    },
    [showEditor]
  );

  return (
    <div {...getLineProps({ line, key: rowNum })}>
      <LineNo>{rowNum}</LineNo>
      <IconButton
        style={{ margin: "-2px 0px -2px -20px" }}
        variant="primary"
        icon="plus"
        className="hidden"
        onClick={() => {
          setShowEditor(true);
        }}
      />
      {line.map((token, key) => (
        <span {...getTokenProps({ token, key })} />
      ))}
      {commentsForRow.map((comment, key) => {
        console.log("render commentbox for line", rowNum, key);
        return <CommentBox {...{ ...comment, key, onReplyClicked }} />;
      }) || null}
      {showEditor && (
        <AddComment
          {...{
            ...props,
            comments: commentsForRow,
            line: rowNum,
            onEditorSubmit,
          }}
        />
      )}
    </div>
  );
};

// const HighlightPre = ({ ...props }: HighlightPreProps) => {
const HighlightPre: React.SFC<HighlightPreProps> = ({ ...props }) => {
  const { className, data, tokens } = props;

  const codeRef = useRef<HTMLElement>(null);
  const useComments = useState(getCommentsForFile(data));

  console.log("comments for file", useComments[0]);

  console.log("HighlightPre renders", props);

  /*   const rows = insertCommentsToCode(tokens, data);

  return (
    <pre className={className}>
      <code className={`code-content ${className}`}>
        {rows.map((line, i) => {
          return Array.isArray(line) ? (
            <HighlightRow line={line} index={i} {...props} />
          ) : (
            <CommentBox
              {...line}
              onReplyClicked={() => {
                console.log("opne editor for line ", i + 1);
              }}
              key={10 * rows.length + i}
            />
          );
        })}
      </code>
    </pre>
  ); */

  useEffect(() => {
    console.log("on useEffect HighlightPre");
  });

  // <HighlightRow line={line} index={i} key={i} {...props} />
  return (
    <pre className={className}>
      <code
        className={`code-content ${className}`}
        ref={codeRef}
        onMouseOut={(e: any): void => {
          setIsHovered(codeRef, e, false);
        }}
        onMouseOver={(e: any): void => {
          setIsHovered(codeRef, e, true);
        }}
      >
        {tokens.map((line, i) => (
          <HighlightRow
            {...props}
            line={line}
            rowNum={i + 1}
            key={i + 1}
            useComments={useComments}
          />
        ))}
      </code>
    </pre>
  );
};

export const CodeFile: React.SFC<Props> = ({ code, path, postId }) => {
  const lang = path ? filenameToLang(path) : "";
  const variables = {
    path,
    postId,
  };

  return (
    <FindCodeReviewQuestionsComponent variables={variables}>
      {({ data, loading }) => {
        if (!data || loading) {
          return null;
        }

        console.log("FindCodeReviewQuestionsComponent");

        return (
          <HighlightCode
            code={code || ""}
            lang={lang}
            data={data}
            postId={postId}
            path={path}
          />
        );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};
