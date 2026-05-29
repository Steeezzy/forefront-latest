import type { ConfigEnv, UserConfigExport } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default ({}: ConfigEnv): UserConfigExport => {
  return {
    plugins: [react()],
    root: resolve(__dirname, '../../apps/widget-service'),
    build: {
      lib: {
        entry: resolve(__dirname, '../../apps/widget-service/src/index.ts'),
        name: 'QuestronWidget',
        fileName: 'widget-bundle',
        formats: ['iife'],
      },
      outDir: resolve(__dirname, '../../apps/web/public'),
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
