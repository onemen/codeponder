import * as React from "react";
import styled from "styled-components";

const MyInput = styled.input`
  font-size: 1.8rem;
  color: #0d0d0d;
`;

export class Input extends React.PureComponent<any> {
  render() {
    return <MyInput {...this.props} />;
  }
}
