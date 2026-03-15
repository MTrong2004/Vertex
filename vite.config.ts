import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import {execSync} from 'child_process';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

const runStructureGenerator = () => {
  try {
    execSync('node scripts/generate-site-structure.mjs', {stdio: 'ignore'});
  } catch (error) {
    console.warn('[site-structure] Failed to generate website-structure.md');
  }
};

const shouldRegenerateForFile = (filePath: string): boolean => {
  const normalized = filePath.replace(/\\/g, '/');
  return (
    normalized.endsWith('/src/App.tsx') ||
    normalized.includes('/src/pages/') ||
    normalized.includes('/src/components/dashboard/')
  );
};

const siteStructurePlugin = () => ({
  name: 'site-structure-generator',
  buildStart() {
    runStructureGenerator();
  },
  handleHotUpdate(context: {file: string}) {
    if (shouldRegenerateForFile(context.file)) {
      runStructureGenerator();
    }
  },
});

export default defineConfig(({mode}) => {
  const env = loadEnv(mode, '.', '');
  const basePath = env.VITE_BASE_PATH || '/';
  return {
    base: basePath,
    plugins: [siteStructurePlugin(), react(), tailwindcss()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      host: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      allowedHosts: true,
    },
  };
});
