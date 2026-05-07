import { Component } from "react";
//fail gracefully
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }
  //attempt to get hold of specific error
  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      //return specific error or generic error
      message: error?.message || "Unexpected app error.",
    };
  }
  //log error detail for debugging purposes
  componentDidCatch(error, errorInfo) {
    console.error("UI crash captured by ErrorBoundary", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "1rem" }}>
          <h2>Something went wrong</h2>
          <p> {/*display user friendly error message*/}
            The page could not be rendered. Please reload the page or try again later. If this issue persists, contact the system administrator. 
          </p>
          <p>Details: {this.state.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
