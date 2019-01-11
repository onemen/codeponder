import * as React from "react";
import styled, {
  SimpleInterpolation,
  FlattenSimpleInterpolation,
} from "styled-components";
import "prismjs/themes/prism-coy.css";

interface Props extends React.HTMLAttributes<HTMLPreElement> {
  fontSize?: number;
  lang: string;
  selectedLines: FlattenSimpleInterpolation;
}

interface styleProps {
  fontSize?: number;
  selectedLines: SimpleInterpolation;
}

const Pre = styled.pre`
  font-size: ${(p: styleProps) => p.fontSize || 14}px;

  &.code-content code[class*="language-"] {
    /* override prism-coy border */
    border: 1px solid #ddd;
    border-radius: 3px;
    box-shadow: none;
    margin-bottom: 1em;
    margin-top: 1em;
    overflow: hidden;
    padding: 0;
  }

  & .line-number {
    color: #999;
    padding-left: 0.625em;
    padding-right: 0.625em;
    text-align: right;
    user-select: none;
    min-width: 3em;
    width: 1%;

    &::before {
      content: attr(data-line-number);
    }
  }

  & .token-line {
    &.is-selected {
      background: hsla(24, 20%, 50%, 0.08);
      background: linear-gradient(
        to right,
        hsla(24, 20%, 50%, 0.1) 70%,
        hsla(24, 20%, 50%, 0)
      );
    }

    & .token-html {
      padding-left: 0.8em;
      padding-right: 0.625em;
    }
  }

  & .btn-open-edit {
    appearance: none;
    border: none;
    text-align: center;
    text-transform: uppercase;
    font-weight: 500;

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

    & svg {
      display: inline-block;
      fill: currentColor;
      vertical-align: text-top;
      pointer-events: none;
    }
  }

  &.js-select-line {
    & .token-line {
      cursor: pointer;
    }
  }

  &:not(.js-select-line) {
    & .token-line.is-hovered {
      & .btn-open-edit {
        opacity: 1;
        cursor: pointer;
      }

      & .btn-open-edit:hover {
        transform: scale(1);
      }
    }
  }

  & .discussion-container {
    border-top: 1px solid #dfe2e5;
    border-bottom: 1px solid #dfe2e5;
  }

  ${(p: styleProps) => p.selectedLines}
`;

export const CodeCard: React.FunctionComponent<Props> = ({
  lang,
  children,
  ...props
}) => (
  <Pre className={`code-content language-${lang}`} {...props}>
    <code className={`language-${lang}`}>
      <table>
        <tbody>{children}</tbody>
      </table>
    </code>
  </Pre>
);
