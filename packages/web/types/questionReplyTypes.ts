import {
  CodeReviewQuestionInfoFragment,
  QuestionReplyInfoFragment,
} from "../generated/apollo-components";

export interface EditorSubmitProps {
  submitted: boolean;
  response?: CodeReviewQuestionInfoFragment | QuestionReplyInfoFragment | void;
}
