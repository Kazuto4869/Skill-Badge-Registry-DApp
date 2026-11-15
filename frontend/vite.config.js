import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// Plugin React giúp Vite biên dịch JSX và cập nhật trang khi lưu file trong lúc dev.
export default defineConfig({
  plugins: [react()],
});
