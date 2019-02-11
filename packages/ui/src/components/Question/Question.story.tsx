import { action } from "@storybook/addon-actions";
import { storiesOf } from "@storybook/react";
import * as React from "react";
import { CommentCard, Question } from ".";

const data = {
  id: "dafs",
  title: "i am a title",
  markdown: React.createElement(
    "label",
    null,
    `i am a question body
        Lorem ipsum dolor sit amet consectetur adipisicing elit. Est consequuntur modi quas alias placeat aliquam vitae explicabo magni saepe commodi. Corporis ullam ratione fugit optio tempore provident voluptates commodi quasi!`
  ),
  codeSnippet: "i am code",
  numReplies: 14,
  createdAt: "12/28/2018",
  path: "/packages/server/package.json",
  creator: {
    id: "123",
    username: "bob",
    pictureUrl: "https://dummyimage.com/600x400/000/fff",
    bio: "I a m bio",
    accessToken: "adsfasd",
  },
};

storiesOf("Question", module).add("basic example", () => (
  <div style={{ display: "inline-block" }}>
    <Question {...data} />
  </div>
));

storiesOf("Question", module).add("comment example", () => (
  <pre style={{ display: "inline-block", fontSize: "14px", lineHeight: "1.5" }}>
    <code>
      <CommentCard
        {...data}
        isOwner={true}
        onReplyClick={action("reply button click")}
      />
    </code>
  </pre>
));
