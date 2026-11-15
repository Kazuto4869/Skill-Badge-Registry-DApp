import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

// Điểm khởi động: gắn App vào #root của index.html; StrictMode hỗ trợ phát hiện lỗi khi dev.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
