import type {ShaderModule} from '@luma.gl/shadertools';

type OutlineProps = {
  outlineWidthUnits?: number;
  outlineMinPixels?: number;
  outlineMaxPixels?: number;
};

const uniformBlock = `\
uniform outlineUniforms {
  highp int outlineWidthUnits;
  float outlineMinPixels;
  float outlineMaxPixels;
} outline;
`;
export const outlineUniforms = {
  name: 'outline',
  vs: uniformBlock,
  uniformTypes: {
    outlineWidthUnits: 'i32',
    outlineMinPixels: 'f32',
    outlineMaxPixels: 'f32'
  }
} as const satisfies ShaderModule<OutlineProps>;
