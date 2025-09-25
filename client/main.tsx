import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App"; // App.tsx is already in client/

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
