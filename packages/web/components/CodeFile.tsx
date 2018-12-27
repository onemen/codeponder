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
import { AddComment, CommentBox, CommentProps, LineNo } from "./Comment";

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

interface Comments {
  [key: number]: CommentProps[];
}

const normalizeQuestions = (prop: FindCodeReviewQuestionsQuery): Comments => {
  const comment = ({
    text,
    creator,
    __typename,
  }: CodeReviewQuestionInfoFragment | QuestionReplyInfoFragment) => ({
    text: text,
    username: creator.username,
    isOwner: true, // Todo: need to ger real value
    type: (__typename || "").includes("Reply") ? "reply" : "question",
  });

  return prop.findCodeReviewQuestions.reduce((comments: Comments, props) => {
    const line = props.endingLineNum;
    comments[line] = comments[line] || [];
    comments[line].push(comment(props));
    props.replies.forEach(reply => comments[line].push(comment(reply)));
    return comments;
  }, {});
};

interface HighlightProps {
  code: string;
  lang: string;
  data: FindCodeReviewQuestionsQuery;
  postId: string;
  path?: string;
}

const HighlightCode: React.SFC<HighlightProps> = ({
  code,
  lang,
  data,
  postId,
  path,
}) => {
  const hasLoadedLanguage = useRef(false);
  const [loading, setloading] = useState(true);
  const [showEditor, setShowEditor] = useState(0);

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

  return (
    <Highlight Prism={Prism} code={code} language={lang}>
      {({ className, style, tokens, getLineProps, getTokenProps }) => {
        const comments = normalizeQuestions(data);
        return (
          <Pre className={className} style={style}>
            <code className={`code-content ${className}`}>
              {tokens.map((line, i) => (
                <div {...getLineProps({ line, key: i })}>
                  <LineNo
                    onClick={() => {
                      setShowEditor(i);
                    }}
                  >
                    {i + 1}
                  </LineNo>
                  {line.map((token, key) => (
                    <span {...getTokenProps({ token, key })} />
                  ))}
                  {comments[i + 1] &&
                    comments[i + 1].map((comment, key) => (
                      <CommentBox {...comment} key={i * 1000 + key} />
                    ))}
                  {showEditor && i == showEditor ? (
                    <AddComment
                      line={i + 1}
                      closeCommentEditor={() => setShowEditor(0)}
                      code={code}
                      programmingLanguage={lang}
                      postId={postId}
                      path={path}
                    />
                  ) : null}
                </div>
              ))}
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
