import { useRef, useState, useEffect } from "react";
import * as Prism from "prismjs";
import "prismjs/themes/prism-coy.css";

import styled, { css } from "styled-components";
import Highlight, { Token } from "prism-react-renderer";

import {
  FindCodeReviewQuestionsComponent,
  FindCodeReviewQuestionsQuery,
  CodeReviewQuestionInfoFragment,
  QuestionReplyInfoFragment,
} from "./apollo-components";
import { filenameToLang } from "../utils/filenameToLang";
import { loadLanguage } from "../utils/loadLanguage";
import { QuestionSection } from "./QuestionSection";

interface Props {
  code: string | null;
  path?: string;
  postId: string;
}

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

const YELLOW = "rgb(238, 238, 88)";
const RED = "rgb(238, 238, 88)";

const CommentBoxContainer = styled.div<{ color?: string }>`
  background-color: #fff;
  margin-left: calc(3em - 0px);
  border-left: 1px solid #999;
  padding: 5px 0 5px 10px;

  & .comment-innder-box {
    border: 1px solid #999;
    border-left: 10px solid ${p => p.color || YELLOW};
    border-radius: 5px;
  }

  & .comment-title {
    padding: 0.5em;
    border-bottom: 1px solid #999;
  }

  & .comment-creator {
    font-weight: 600;
  }

  & .repo-owner {
    background-color: rgb(253, 243, 218);
    border: 1px solid rgb(233, 219, 205);
    margin-left: 0.5em;
    padding: 2px 4px;
  }

  & .comment-text {
    margin: 0;
    padding: 0.5em;
    white-space: normal;
  }
`;

interface CommentProps {
  text?: string;
  username?: string;
  isOwner?: boolean;
  type: string;
}

interface Comments {
  [key: number]: CommentProps[];
}

const CommentBox: React.SFC<CommentProps> = ({
  username,
  text,
  isOwner,
  type,
}) => (
  <CommentBoxContainer
    color={type.includes("Reply") ? "rgb(235, 73, 144)" : "rgb(238, 238, 88)"}
  >
    <div className="comment-innder-box">
      <div className="comment-title">
        <span className="comment-creator">{username}</span>
        {isOwner ? <span className="repo-owner">Author</span> : null}
        <span style={{ marginLeft: "50%" }}>{type}</span>
      </div>
      <p className="comment-text">
        {text}
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Est
        consequuntur modi quas alias placeat aliquam vitae explicabo magni saepe
        commodi. Corporis ullam ratione fugit optio tempore provident voluptates
        commodi quasi!
      </p>
    </div>
  </CommentBoxContainer>
);

const normalizeQuestions = (prop: FindCodeReviewQuestionsQuery): Comments => {
  const comment = ({
    text,
    creator,
    __typename,
  }: CodeReviewQuestionInfoFragment | QuestionReplyInfoFragment) => ({
    text: text,
    username: creator.username,
    isOwner: true, // Todo: need to ger real value
    type: __typename || "",
  });

  return prop.findCodeReviewQuestions.reduce((comments: Comments, props) => {
    const line = props.endingLineNum;
    comments[line] = comments[line] || [];
    comments[line].push(comment(props));
    props.replies.forEach(reply => comments[line].push(comment(reply)));
    return comments;
  }, {});
};

const insertCommentsToCode = (
  tokens: Token[][],
  data: FindCodeReviewQuestionsQuery
): (Token[] | CommentProps)[] => {
  const comments = normalizeQuestions(data);
  return tokens.reduce((lines: (Token[] | CommentProps)[], line, i) => {
    lines.push(line);
    if (comments[i + 1]) {
      lines.push(...comments[i + 1]);
    }
    return lines;
  }, []);
};

interface HighlightProps {
  code: string;
  lang: string;
  data: FindCodeReviewQuestionsQuery;
}

const HighlightCode: React.SFC<HighlightProps> = ({ code, lang, data }) => {
  const hasLoadedLanguage = useRef(false);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    if (!hasLoadedLanguage.current) {
      loadLanguage(lang)
        .then(() => {
          setloading(false);
          hasLoadedLanguage.current = true;
        })
        .catch(() => {});
    }
  }, []);

  if (loading) {
    return null;
  }

  const Pre = styled.pre`
    & code[class*="language-"] {
      padding-left: 0;
    }

    ${SelectLines(data)};
  `;

  const LineNo = styled.span`
    border-right: 1px solid #999;
    display: inline-block;
    color: #999;
    letter-spacing: -1px;
    margin-right: 0.65em;
    padding-right: 0.8em;
    text-align: right;
    user-select: none;
    width: 3em;
  `;

  return (
    <Highlight Prism={Prism} code={code} language={lang}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => {
        const mixedTokens = insertCommentsToCode(tokens, data);
        return (
          <Pre className={className} style={style}>
            <code className={className}>
              {mixedTokens.map((line, i) => {
                return Array.isArray(line) ? (
                  <div {...getLineProps({ line, key: i })}>
                    <LineNo>{i + 1}</LineNo>
                    {line.map((token, key) => (
                      <span {...getTokenProps({ token, key })} />
                    ))}
                  </div>
                ) : (
                  <CommentBox {...line} key={tokens.length + i} />
                );
              })}
            </code>
          </Pre>
        );
      }}
    </Highlight>
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

        return (
          <>
            <HighlightCode code={code || ""} lang={lang} data={data} />
            <QuestionSection
              variables={variables}
              code={code || ""}
              postId={postId}
              programmingLanguage={lang}
              path={path}
            />
          </>
        );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};
