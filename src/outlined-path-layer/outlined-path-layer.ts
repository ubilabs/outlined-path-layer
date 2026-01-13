import {Accessor, Color, DefaultProps, UNIT, Unit} from '@deck.gl/core';
import {PathLayer, PathLayerProps} from '@deck.gl/layers';
import {outlineUniforms} from './outlined-path-uniforms';

import fs from './outlined-path-layer-fragment.glsl';
import vs from './outlined-path-layer-vertex.glsl';

export type OutlinedPathLayerProps<DataT = unknown> = PathLayerProps<DataT> & {
  /**
   * The rgba color is in the format of `[r, g, b, [a]]`.
   * @default [0, 0, 0, 255]
   */
  getOutlineColor?: Accessor<DataT, Color>;
  /**
   * Width of each object
   * @default 0
   */
  getOutlineWidth?: Accessor<DataT, number>;
  /**
   * The units of the line width, one of `'meters'`, `'common'`, and `'pixels'`.
   * @default 'pixels'
   */
  outlineWidthUnits?: Unit;
  /**
   * The minimum outline width in pixels.
   * @default 0
   */
  outlineMinPixels?: number;
  /**
   * The maximum outline width in pixels.
   * @default Number.MAX_SAFE_INTEGER
   */
  outlineMaxPixels?: number;
};

const defaultProps: DefaultProps<OutlinedPathLayerProps> = {
  ...PathLayer.defaultProps,
  getOutlineColor: {type: 'accessor', value: [0, 0, 0, 255]},
  getOutlineWidth: {type: 'accessor', value: 0},
  outlineWidthUnits: 'pixels',
  outlineMinPixels: {type: 'number', min: 0, value: 0},
  outlineMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER}
};

export default class OutlinedPathLayer<DataT> extends PathLayer<
  DataT,
  OutlinedPathLayerProps<DataT>
> {
  static layerName = 'OutlinedPathLayer';

  static defaultProps = defaultProps;

  getShaders() {
    const shaders = super.getShaders();

    return {
      ...shaders,
      vs,
      fs,
      modules: [...shaders.modules, outlineUniforms]
    };
  }

  initializeState() {
    super.initializeState();
    this.getAttributeManager()!.addInstanced({
      instanceOutlineColors: {
        size: this.props.colorFormat.length,
        type: 'unorm8',
        transition: true,
        accessor: 'getOutlineColor',
        defaultValue: [0, 0, 0, 255]
      },
      instanceOutlineWidths: {
        size: 1,
        transition: true,
        accessor: 'getOutlineWidth',
        defaultValue: 0
      }
    });
  }

  draw({uniforms}: any) {
    const {outlineWidthUnits, outlineMinPixels, outlineMaxPixels} = this.props;

    this.state.model!.shaderInputs.setProps({
      outline: {
        outlineWidthUnits: UNIT[outlineWidthUnits!],
        outlineMinPixels,
        outlineMaxPixels
      }
    });

    super.draw({uniforms});
  }
}
