import {defineConfig} from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
  base: './',
  build: {
    outDir: './dist_frontend'
  },
  server: {
    port: 6969
  },
  plugins: [
    glsl({
      include: ['**/*.glsl', '**/*.vs', '**/*.fs', '**/*.vert', '**/*.frag'],
      exclude: undefined,
      defaultExtension: 'glsl'
    })
  ]
});
