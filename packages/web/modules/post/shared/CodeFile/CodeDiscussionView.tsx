import { CommentCard, styled } from "@codeponder/ui";
import React, { useContext, useEffect, useRef, useState } from "react";
import { QuestionInfoFragment } from "../../../../generated/apollo-components";
import { CreateQuestionReply } from "../CreateComment";
import {
  loadLanguagesForMarkdown,
  MarkdownPreview,
} from "../MarkdownEditor/Preview";
import { PostContext } from "../PostContext";

interface CodeDiscussionViewProps {
  question: QuestionInfoFragment;
  toggleDiscussion: () => void;
  showDiscussion: boolean;
  lineNum: number;
}

const DiscussionNavBar = styled.div`
  background-color: #f6f8fa;
  border-bottom: 1px solid #e1e4e8;
  padding: 10px;
  display: flex;
  justify-content: space-between;
  align-items: baseline;

  & .header-title {
    font-weight: 400;
    line-height: 1.125;
    margin-bottom: 0;
    word-wrap: break-word;
  }

  & .header-sub-title {
    color: #a3aab1;
    font-weight: 300;
    letter-spacing: -1px;
  }
`;

const DiscussionContainer = styled.div`
  background-color: #ffffff;
  border-top: 1px solid #dfe2e5;
  border-bottom: ${(p: { showReply: boolean }) =>
    p.showReply ? "none" : "1px solid #dfe2e5"};
  margin-bottom: 0px;
`;

const COLLAPSE = "Collapse this discussion";
const EXPANDED = "Expanded this discussion";

const badgeClassList = (open: boolean) => {
  const classNames = "token-btn discussion-badge";
  return open ? `${classNames} is-open` : classNames;
};

// load all languages for markdown text in question and replies
const useLoadingLanguage = (question: QuestionInfoFragment) => {
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const discussion = [question, ...question.comments];
    const markdownText = discussion.map(({ text }) => text).join("\n");
    loadLanguagesForMarkdown(markdownText).then(() => {
      setLoading(false);
    });
  }, [question]);

  return loading;
};

export const CodeDiscussionView: React.FC<CodeDiscussionViewProps> = ({
  question,
  toggleDiscussion,
  showDiscussion,
  lineNum,
}) => {
  const discussionRef = useRef<HTMLDivElement>(null);
  const { owner } = useContext(PostContext);
  const [showReply, setShowReply] = useState(false);
  const loadingLanguage = useLoadingLanguage(question);

  useEffect(() => {
    if (showDiscussion) {
      discussionRef.current!.classList.add("is-open");
    }
  }, [showDiscussion, showReply]);

  useEffect(() => {
    // we only need maxHeight for the animation, we remove it after the
    // animation ends for the case the height is grater than 2000px
    if (showDiscussion) {
      const id = setTimeout(() => {
        discussionRef.current!.style.maxHeight = "none";
      }, 200);
      return () => clearTimeout(id);
    }
  }, [showDiscussion]);

  useEffect(() => {
    if (showDiscussion) {
      discussionRef.current!.classList.add("is-open");
    }
  }, [showDiscussion, showReply]);

  useEffect(() => {
    // we only need maxHeight for the animation, we remove it after the
    // animation ends for the case the height is grater than 2000px
    if (showDiscussion) {
      const id = setTimeout(() => {
        discussionRef.current!.style.maxHeight = "none";
      }, 200);
      return () => clearTimeout(id);
    }
  }, [showDiscussion]);

  return (
    <>
      <button
        className={badgeClassList(showDiscussion)}
        title={showDiscussion ? COLLAPSE : EXPANDED}
        onClick={() => {
          if (showDiscussion) {
            discussionRef.current!.style.maxHeight = "";
            discussionRef.current!.classList.remove("is-open");
            setTimeout(() => {
              toggleDiscussion();
              setShowReply(false);
            }, 200);
          } else {
            toggleDiscussion();
            setShowReply(false);
          }
        }}
      >
        <span className="badge-counter">{question.numComments}</span>
        <span className="badge-icon">▾</span>
      </button>
      {showDiscussion && (
        <DiscussionContainer
          ref={discussionRef}
          className="inner-animate-box"
          showReply={showReply}
        >
          <DiscussionNavBar>
            <h2 className="header-title">
              <span className="discussion-title">{question.title}</span>
            </h2>
            <span className="header-sub-title">{question.lineNum}</span>
          </DiscussionNavBar>
          {!loadingLanguage &&
            [question, ...question.comments].map(({ text, ...props }, key) => {
              const markdown = MarkdownPreview({
                source: text,
                className: "markdown-body",
              });
              return (
                <CommentCard
                  {...props}
                  markdown={markdown}
                  isOwner={props.creator.id === owner}
                  key={key}
                  onReplyClick={() => setShowReply(true)}
                />
              );
            })}
        </DiscussionContainer>
      )}
      {showReply && (
        <CreateQuestionReply
          view="code-view"
          onEditorSubmit={() => setShowReply(false)}
          lineNum={lineNum}
          questionId={question!.id}
        />
      )}
    </>
  );
};
