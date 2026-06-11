import { defineConfig } from "@apps-in-toss/web-framework/config";

export default defineConfig({
  appName: "eojje-issue",
  brand: {
    displayName: "어제 이슈",
    primaryColor: "#2F6BFF",
    icon: "/icon.svg"
  },
  web: {
    host: "localhost",
    port: 5175,
    commands: {
      dev: "vite dev",
      build: "vite build"
    }
  },
  permissions: [],
  outdir: "dist"
});
