import { useRef, useState, useEffect } from "react";
import Prism from "prismjs/components/prism-core";
import "prismjs/themes/prism-coy.css";
import { styled, css, SimpleInterpolation } from "@codeponder/ui";
import { CommentProps, Comments } from "./commentUI";

import {
  FindCodeReviewQuestionsComponent,
  FindCodeReviewQuestionsQuery,
  CodeReviewQuestionInfoFragment,
  QuestionReplyInfoFragment,
} from "./apollo-components";
import { filenameToLang } from "../utils/filenameToLang";
import { loadLanguage } from "../utils/loadLanguage";
import { CommentsForRow } from "./CommentsForRow";

interface Props {
  owner: string;
  code: string | null;
  path?: string;
  postId: string;
}

interface loadingCodeState {
  pending: boolean;
  resolved?: string[];
}

/*
 * *Styles for the line numbers coming from the server
 *
 * TODO: Perhaps refactor SelectLinesMouse as a 'sub function' of SelectLines?
 * Or the two in a more general utils?
 */
const SelectLines = (prop: FindCodeReviewQuestionsQuery) => {
  let offset = 0;
  const styles = prop.findCodeReviewQuestions.reduce((total, current) => {
    const { startingLineNum, endingLineNum, numReplies } = current;
    total += `
     & .token-line:nth-child(n+${startingLineNum +
       offset}):nth-child(-n+${endingLineNum + offset}) {
      background: hsla(24, 20%, 50%,.08);
      background: linear-gradient(to right, hsla(24, 20%, 50%,.1) 70%, hsla(24, 20%, 50%,0));
    }
     `;
    offset += numReplies + 1;
    return total;
  }, "");
  return css`
    ${styles}
  `;
};

const getCommentsForFile = (
  prop: FindCodeReviewQuestionsQuery,
  owner: string
): Comments => {
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
    isOwner: creator.username == owner,
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

const setIsHovered = (
  { target: elm, currentTarget: current }: any,
  showButton: boolean
) => {
  while (elm && elm != current && !elm.classList.contains("token-line")) {
    // hide the button when user hover over commets or line-number
    const name = elm.classList[0];
    if (name && name.match(/CommentBoxContainer|line-number/)) {
      showButton = false;
    }
    elm = elm.parentNode || null;
  }
  if (elm && current) {
    current
      .querySelectorAll(".is-hovered")
      .forEach((button: HTMLButtonElement) =>
        button.classList.toggle("is-hovered", false)
      );
    if (showButton) {
      elm.childNodes[1].classList.add("is-hovered");
    }
  }
};

// TODO : move to ui, check if i can move also the import "prismjs/themes/prism-coy.css";
const Pre = styled.pre`
  & code[class*="language-"] {
    padding-left: 0;
    overflow: hidden;
  }

  & .line-number {
    border-right: 1px solid #999;
    color: #999;
    cursor: pointer;
    display: inline-block;
    letter-spacing: -1px;
    margin-right: 0.65em;
    padding-right: 0.8em;
    text-align: right;
    user-select: none;
    width: 3em;

    &.comment {
      cursor: default;
    }
  }

  & .btn-open-edit {
    appearance: none;
    border: none;
    text-align: center;
    text-transform: uppercase;
    font-weight: 500;
    cursor: pointer;

    /* primary */
    background-color: #6dc1fd;
    color: #ffffff;
    font-size: 1.4rem;
    padding: 0.8rem 1rem;
    text-transform: uppercase;
    border-radius: 0.4rem;

    margin: -2px 0px -2px -20px;
    padding: 0;
    width: 22px;
    height: 22px;
    transform: scale(0.8);
    transition: transform 0.1s ease-in-out;

    &.hidden {
      opacity: 0;
    }

    &:hover {
      transform: scale(1);
      opacity: 1;
    }

    &.is-hovered {
      opacity: 1;
    }

    & svg {
      display: inline-block;
      fill: currentColor;
      vertical-align: text-top;
      pointer-events: none;
    }
  }

  ${(p: { selectedLines: SimpleInterpolation }) => p.selectedLines}
`;

// TODO: move to loadLanguage.ts in utils - rename it to prsimUtils.ts
// prism-react-renderer
// const getTokenProps = ({
//   key,
//   className,
//   style,
//   token,
//   ...rest
// }: TokenInputProps): string => {
//   const types = token.types.join(" ");
//   if (types == "plain") {
//     return token.content;
//   }

//   const output = {
//     ...rest,
//     class: `token ${types}`,
//   };

//   if (style !== undefined) {
//     output.style =
//       output.style !== undefined ? { ...output.style, ...style } : style;
//   }

//   if (key !== undefined) output.key = key;
//   if (className) output.class += ` ${className}`;

//   const stringOutput = Object.entries(output)
//     .map(([key, val]) => `${key}="${val}"`)
//     .join(" ");

//   return `<span ${stringOutput}>${token.content}</span>`;
// };

const PlusButton =
  '<button variant = "primary" class="btn-open-edit hidden"><svg viewBox="0 0 12 16" version="1.1" width="12" height="16" aria-hidden="true" preserveAspectRatio="xMaxYMax meet"><path fill-rule="evenodd" d="M12 9H7v5H5V9H0V7h5V2h2v5h5v2z"></path></svg></button>';

const onPrismWrap = (env: any) => {
  console.log("wrap", env);
};

const getHighlightCode = async (code: string, lang: string) => {
  // const allHooks = Prism.hooks.all;
  // if (!Prism.hooks.all["wrap"].includes(onPrismWrap)) {
  //   Prism.hooks.add("wrap", onPrismWrap);
  //   console.log("add wrap hook");
  // } else {
  //   console.log("wrap hook already exist");
  // }

  let grammar = Prism.languages[lang];
  if (grammar === undefined) {
    await loadLanguage(lang);
    grammar = Prism.languages[lang];
  }
  const mixedTokens =
    grammar !== undefined ? Prism.tokenize(code, grammar) : [code];

  const encoded = Prism.util.encode(mixedTokens);
  // console.log({ encoded });
  const stringify = Prism.Token.stringify(
    encoded,
    lang as Prism.LanguageDefinition,
    {} as HTMLPreElement
  );
  // console.log({ stringify });
  // console.log({ splited_stringify: stringify.split("\n") });

  // const normalize: Token[][] = normalizeTokens(mixedTokens as any);
  // return normalize.map((line, rowNum) => {
  //   const children = line
  //     .map((token, key) => getTokenProps({ token, key }))
  //     .join("");
  //   return `<span class="line-number">${rowNum +
  //     1}</span>${PlusButton}${children}`;
  // });

  return stringify.split("\n").map((line, rowNum) => {
    return `<span class="line-number">${rowNum + 1}</span>${PlusButton}${line}`;
  });
};

const useLoadLanguage = (lang: string, code: string) => {
  const hasLoadedLanguage = useRef(false);
  const [loadingCode, setLoadingCode] = useState<loadingCodeState>({
    pending: true,
  });

  useEffect(() => {
    if (!hasLoadedLanguage.current) {
      getHighlightCode(code, lang).then(tokens => {
        hasLoadedLanguage.current = true;
        setLoadingCode({ pending: false, resolved: tokens });
      });
    }
  }, []);
  return loadingCode;
};

export const CodeFile: React.SFC<Props> = ({ code, path, postId, owner }) => {
  const lang = path ? filenameToLang(path) : "";
  const loadingCode = useLoadLanguage(lang, code || "");

  const variables = {
    path,
    postId,
  };

  /**
   ***************************************
   * try to use lazy loading for bug files
   *
   */

  return (
    <FindCodeReviewQuestionsComponent variables={variables}>
      {({ data, loading }) => {
        if (!data || loading || loadingCode.pending) {
          return null;
        }

        const highlightedCode = loadingCode.resolved!;
        const comments = getCommentsForFile(data, owner);

        return (
          <Pre className={`language-${lang}`} selectedLines={SelectLines(data)}>
            <code
              className={`code-content language-${lang}`}
              onMouseOut={(e: any): void => {
                setIsHovered(e, false);
              }}
              onMouseOver={(e: any): void => {
                setIsHovered(e, true);
              }}
            >
              {highlightedCode.map((line, index) => (
                <CommentsForRow
                  key={index}
                  code={code || ""}
                  comments={comments[index + 1]}
                  lang={lang}
                  line={line}
                  owner={owner}
                  rowNum={index + 1}
                  {...variables}
                />
              ))}
            </code>
          </Pre>
        );
      }}
    </FindCodeReviewQuestionsComponent>
  );
};
