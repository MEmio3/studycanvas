import { defineConfig } from 'vite';
import { crx } from '@crxjs/vite-plugin';

const manifest = {
  manifest_version: 3,
  name: "StudyCanvas Extractor",
  version: "1.0.0",
  description: "Capture AI chats and selections to your StudyCanvas deck.",
  action: {
    default_title: "Open StudyCanvas",
  },
  background: {
    service_worker: "src/extension/background.js",
    type: "module"
  },
  permissions: [
    "activeTab",
    "scripting",
    "sidePanel",
    "storage",
    "tabs"
  ],
  host_permissions: [
    "*://gemini.google.com/*"
  ],
  side_panel: {
    default_path: "index.html"
  },
  content_scripts: [
    {
      matches: ["*://gemini.google.com/*"],
      js: ["src/extension/content/gemini.js"]
    }
  ]
};

export default defineConfig({
  plugins: [crx({ manifest })],
  server: {
    port: 5173,
    strictPort: true,
    hmr: {
      port: 5173
    },
    cors: {
      origin: '*',
      methods: '*',
      allowedHeaders: '*',
      exposedHeaders: '*'
    }
  }
});
