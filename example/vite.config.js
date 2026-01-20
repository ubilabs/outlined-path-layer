import {defineConfig} from 'vite';

export default defineConfig({
  base: './',
  server: {
    fs: {
      allow: ['..']
    }
  },
  resolve: {
    dedupe: ['@deck.gl/core', '@deck.gl/layers']
  }
});
