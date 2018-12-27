export interface ITheme {
  /**
   * Fonts according to design spec, can be accessed using `fontFamily="key"` in component props
   */
  fonts: {
    [key: string]: string;
  };

  /**
   * Font-sizes according to design spec, can be accessed using `fontSize={index}` in component props
   */
  fontSizes: string[];

  /**
   * Colours according to design spec, can be accessed using `color={index}`/`color={index[]}` and `bg={index[]}`/`bg={index[]}` in component props
   */
  colors: {
    [key: string]: string[];
  };

  /**
   * Border-radii according to design spec, can be accessed using `borderRadius={index}` in component props
   */
  radii: string[];

  /**
   * spacing according to design spec, can be accessed using the `m(t|r|b|l)` and `p(t|r|b|l)` props with the corresponding index
   */
  space: string[];

  textStyles?: {
    [key: string]: {};
  };

  colorStyles?: {
    [key: string]: {};
  };

  buttons: {
    [key: string]: {};
  };
}

const theme: ITheme = {
  fonts: {
    sans: '"Rubik", sans-serif',
    mono: '"Roboto Mono", sans-serif',
  },
  fontSizes: ["8px", "10px", "12px", "13px", "14px", "16px", "18px"],
  colors: {
    primary: [
      "#07385A",
      "#184F76",
      "#3290D4",
      "#6DC1FD",
      "#A7DAFF",
      "#E2F3FF",
      "#F3FAFF",
    ],
    neutrals: [
      "#263238",
      "#78909C",
      "#B7C1C6",
      "#E6EAEF",
      "#F9FBFD",
      "#FFFFFF",
    ],
    errors: ["#7A1414", "#BE0A0A", "#FF4F4F", "#FFC6C6", "#FFF3F3"],
    warnings: ["#684B00", "#CC9C23", "#FFCB44", "#FFE6A6", "#FFF8E7"],
    success: ["#07822A", "#49B267", "#67D987", "#AEF1C1", "#E1FFE9"],
  },
  radii: ["3px", "4px", "5px", "6px"],
  space: ["4px", "6px", "8px", "10px", "14px"],
  buttons: {
    primary: {
      backgroundColor: "#6DC1FD",
      color: "#ffffff",
      margin: "0 10px",
      fontSize: "14px",
      padding: "8px 10px",
      textTransform: "uppercase",
      borderRadius: "4px",
    },
    topic: {
      backgroundColor: "#E2F3FF",
      color: "#3290D4",
      borderRadius: "3px",
      fontSize: "8px",
      padding: "3px",
      paddingRight: "5px",
      paddingLeft: "5px",
      letterSpacing: 0.5,
      fontWeight: "normal",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#F3FAFF",
      },
      "&:not(:last-child)": {
        marginRight: "10px",
      },
    },
    github: {
      display: "flex",
      backgroundColor: "rgb(22, 23, 26)",
      color: "#fff",
      alignItems: "center",
      fontSize: "12px",
      cursor: "pointer",
      fontWeight: "normal",
    },
    form: {
      border: "1px solid rgba(27, 31, 35, 0.2)",
      borderRadius: "0.25em",
      color: "rgb(36, 41, 46)",
      fontSize: "1em",
      marginRight: "1em",
      padding: "0.375em 0.75em",
      "&:hover": {
        backgroundColor: "#e6ebf1",
        backgroundImage: "linear-gradient(-180deg, #f0f3f6, #e6ebf1 90%)",
        backgroundPosition: "-0.5em",
        borderColor: "rgba(27, 31, 35, 0.35)",
      },
      "&.primary": {
        backgroundColor: "#28a745",
        backgroundImage: "linear-gradient(-180deg, #34d058, #28a745 90%)",
        color: "#fff",
      },
      "&.primary:hover": {
        backgroundColor: "#269f42",
        backgroundImage: "linear-gradient(-180deg, #2fcb53, #269f42 90%)",
        backgroundPosition: "-0.5em",
        borderColor: "rgba(27, 31, 35, 0.5)",
      },
      "&.primary.disabled": {
        backgroundColor: "#94d3a2",
        backgroundImage: "none",
        borderColor: "rgba(27, 31, 35, 0.2)",
        boxShadow: "none",
        color: "hsla(0, 0%, 100%, 0.75)",
      },
    },
  },
};
export default theme;
