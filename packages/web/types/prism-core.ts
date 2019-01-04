declare module "prismjs/components/prism-core" {
  import Prism from "prismjs";

  export const languages: Prism.Languages;

  export interface LanguageDefinition extends Prism.LanguageDefinition {}

  export class Token extends Prism.Token {}

  export function tokenize(
    text: string,
    grammar: Prism.LanguageDefinition
  ): Array<Token | string>;

  export const util: Prism.Util;
}

// declare module "prismjs/components/index.js" {
//   export interface PrismUtils {
//     loadLanguages: (lang: string) => void;
//   }
// }

// declare module "prismjs/components/index.js";
// declare module "prismjs/components/index.js" {
//   import * as PrismUtils from "prismjs/components/index.js";
//   export function loadLanguages(lang: string): void;
//   // export default loadLanguages;
// }
