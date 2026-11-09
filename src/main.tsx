import { Component, StrictMode } from "react";
import type { ErrorInfo, ReactNode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Appfeil", error, info.componentStack);
  }
  render() {
    return this.state.error ? (
      <main className="loading-screen">
        <h1>Noe gikk galt i visningen</h1>
        <p>
          Last siden på nytt. Lokalt lagrede prosjekter og produkter slettes
          ikke.
        </p>
        <button onClick={() => location.reload()}>Last inn på nytt</button>
      </main>
    ) : (
      this.props.children
    );
  }
}
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
