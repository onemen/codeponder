import { styled } from "@codeponder/ui";
import React from "react";
import { CommandButton } from "./CommandButton";

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

const CommandContainer = styled.div`
  float: right;

  &.hidden {
    display: none;
  }

  .toolbar-group {
    display: inline-block;
    margin-left: 20px;

    & :first-child {
      margin-left: 0;
    }
  }

  & .toolbar-item {
    background: none;
    border: 0;
    color: #586069;
    display: block;
    float: left;
    padding: 4px 5px;

    :hover {
      color: #0366d6;
    }
  }

  & .tooltipped {
    position: relative;
    z-index: 10;

    ::before {
      border: 6px solid transparent;
      color: #1b1f23;
      content: "";
      display: none;
      height: 0;
      opacity: 0;
      pointer-events: none;
      position: absolute;
      width: 0;
      z-index: 1000001;
    }

    ::after {
      background: #1b1f23;
      border-radius: 3px;
      color: #fff;
      content: attr(aria-label);
      display: none;
      font: normal normal 11px/1.5 -apple-system, BlinkMacSystemFont, Segoe UI,
        Helvetica, Arial, sans-serif, Apple Color Emoji, Segoe UI Emoji,
        Segoe UI Symbol;
      letter-spacing: normal;
      opacity: 0;
      padding: 0.5em 0.75em;
      pointer-events: none;
      position: absolute;
      text-align: center;
      text-decoration: none;
      text-shadow: none;
      text-transform: none;
      white-space: pre;
      word-wrap: break-word;
      z-index: 1000000;
    }

    :active::after,
    :active::before,
    :focus::after,
    :focus::before,
    :hover::after,
    :hover::before {
      animation-delay: 0.4s;
      animation-duration: 0.1s;
      animation-fill-mode: forwards;
      animation-name: tooltip-appear;
      animation-timing-function: ease-in;
      display: inline-block;
      text-decoration: none;
    }
  }

  @keyframes tooltip-appear {
    0% {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  & .tooltipped-n::before,
  & .tooltipped-ne::before,
  & .tooltipped-nw::before {
    border-top-color: #1b1f23;
    bottom: auto;
    margin-right: -6px;
    right: 50%;
    top: -7px;
  }

  & .tooltipped-n::after,
  & .tooltipped-n::after,
  & .tooltipped-s::after {
    transform: translateX(50%);
  }

  & .tooltipped-n::after,
  & .tooltipped-ne::after,
  & .tooltipped-nw::after {
    bottom: 100%;
    margin-bottom: 6px;
    right: 50%;
  }

  & .tooltipped-nw::after {
    right: -30%;
  }
`;

export type Tab = "write" | "preview";

type ToolbarProps = {
  tab: Tab;
  isIE8: boolean;
  onCommand: (name: string) => void;
  handleTabChange: (tab: Tab) => void;
};

export const Toolbar: React.FC<ToolbarProps> = React.memo(
  ({ tab, isIE8, onCommand, handleTabChange }) => (
    <div className="editor-header">
      {!isIE8 && (
        <CommandContainer className={`${tab !== "write" ? "hidden" : ""}`}>
          <div className="toolbar-group">
            <CommandButton onCommand={onCommand} name="header_text" />
            <CommandButton onCommand={onCommand} name="bold_text" />
            <CommandButton onCommand={onCommand} name="italic_text" />
          </div>
          <div className="toolbar-group">
            <CommandButton onCommand={onCommand} name="insert_quote" />
            <CommandButton onCommand={onCommand} name="insert_code" />
            <CommandButton onCommand={onCommand} name="insert_link" />
          </div>
          <div className="toolbar-group">
            <CommandButton onCommand={onCommand} name="bulleted_list" />
            <CommandButton onCommand={onCommand} name="numbered_list" />
            <CommandButton onCommand={onCommand} name="task_list" />
          </div>
        </CommandContainer>
      )}
      <nav className="editor-header-tabs">
        <NavTab
          type="button"
          className={`${tab === "write" ? "selected" : ""}`}
          onClick={() => handleTabChange("write")}
        >
          Write
        </NavTab>
        <NavTab
          type="button"
          className={`${tab === "preview" ? "selected" : ""}`}
          onClick={() => handleTabChange("preview")}
        >
          Preview
        </NavTab>
      </nav>
    </div>
  )
);
