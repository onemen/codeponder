declare module "markdown-to-jsx" {
  export function compiler(markdown: string, options?: object): JSX.Element;

  export default function Markdown(props: {
    children: string;
    options?: object;
    props?: any;
  }): JSX.Element;
}
