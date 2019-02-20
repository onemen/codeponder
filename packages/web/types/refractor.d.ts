declare module "refractor/core.js" {
  import PrismLib from "prismjs";

  export type HastToken = {
    type: "element";
    tagName: string;
    properties: any;
    children: Array<HastToken>;
    value: string;
  };

  export function highlight(
    value: string,
    name: string | PrismLib.LanguageDefinition
  ): Array<HastToken>;

  export function register(grammar: PrismLib.LanguageDefinition): void;

  export function registered(language: string): boolean;
}
