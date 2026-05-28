import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { VersionStamp } from "./components/VersionStamp";
import { AuthProvider } from "./context/AuthContext";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <VersionStamp />
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>
);
