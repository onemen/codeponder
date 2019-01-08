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

  & .code-content {
    /* override prism-coy border */
    border: 1px solid #ddd;
    border-radius: 3px;
    box-shadow: none;
    margin-bottom: 16px;
    margin-top: 16px;
    overflow: hidden;
    padding: 0;
  }

  & .line-number {
    color: #999;
    cursor: pointer;
    padding-left: 10px;
    padding-right: 10px;
    text-align: right;
    user-select: none;
    min-width: 50px;
    width: 1%;

    &::before {
      content: attr(data-line-number);
    }
  }

  & .token-line {
    padding-left: 10px;
    padding-right: 10px;
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

  ${(p: styleProps) => p.selectedLines}

  & table {
    width: 100%;
  }
`;

export const CodeCard: React.FunctionComponent<Props> = ({
  lang,
  children,
  ...props
}) => (
  <Pre className={`language-${lang}`} {...props}>
    <code className={`code-content language-${lang}`}>
      <table>
        <tbody>{children}</tbody>
      </table>
    </code>
  </Pre>
);
