import type { ConfigEnv, UserConfigExport } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default ({}: ConfigEnv): UserConfigExport => {
  return {
    plugins: [react()],
    root: resolve(__dirname, 'widget'),
    build: {
      lib: {
        entry: resolve(__dirname, 'widget/src/index.tsx'),
        name: 'ForefrontWidget',
        fileName: 'widget-bundle',
        formats: ['iife'],
      },
      outDir: resolve(__dirname, 'public'),
      emptyOutDir: false,
      rollupOptions: {
        output: {
          assetFileNames: 'widget-bundle.[ext]',
        },
      },
    },
    define: {
      'process.env': {},
    },
  };
};
