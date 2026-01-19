import {defineConfig} from 'vite';
import glsl from 'vite-plugin-glsl';

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
  // ,
  // plugins: [
  //   glsl({
  //     include: ['**/*.glsl', '**/*.vs', '**/*.fs', '**/*.vert', '**/*.frag', '**/*.glsl.ts'],
  //     exclude: undefined,
  //     defaultExtension: 'glsl'
  //   })
  // ]
});
