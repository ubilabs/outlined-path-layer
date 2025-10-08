import {defineConfig} from 'vite';
import glsl from 'vite-plugin-glsl';

export default defineConfig({
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
