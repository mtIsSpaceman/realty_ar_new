import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: true,
    //allowedHosts: ["10ea-103-182-221-244.ngrok-free.app"],
  },
});
