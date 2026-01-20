// deck.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {Attribute, Layer, project32, picking, UNIT} from '@deck.gl/core';
import {Geometry} from '@luma.gl/engine';
import {Model} from '@luma.gl/engine';
import PathTesselator from './outpath-tesselator';

import {pathUniforms, PathProps} from './outpath-layer-uniforms';
import vs from './outpath-layer.vert';
import fs from './outpath-layer.frag';

import type {
  LayerProps,
  LayerDataSource,
  Color,
  Accessor,
  AccessorFunction,
  Unit,
  UpdateParameters,
  GetPickingInfoParams,
  PickingInfo,
  DefaultProps
} from '@deck.gl/core';
import type {PathGeometry} from './outpath';
import {NumericArray, TypedArray} from '@math.gl/types';

type _PathLayerProps<DataT> = {
  data: LayerDataSource<DataT>;
  /** The units of the line width, one of `'meters'`, `'common'`, and `'pixels'`
   * @default 'meters'
   */
  widthUnits?: Unit;
  /**
   * The units of the line width, one of `'meters'`, `'common'`, and `'pixels'`.
   * @default 'pixels'
   */
  outlineWidthUnits?: Unit;
  /**
   * Path width multiplier.
   * @default 1
   */
  widthScale?: number;
  /**
   * The minimum path width in pixels. This prop can be used to prevent the path from getting too thin when zoomed out.
   * @default 0
   */
  widthMinPixels?: number;
  /**
   * The maximum path width in pixels. This prop can be used to prevent the path from getting too thick when zoomed in.
   * @default Number.MAX_SAFE_INTEGER
   */
  widthMaxPixels?: number;
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
  /**
   * Type of joint. If `true`, draw round joints. Otherwise draw miter joints.
   * @default false
   */

  jointRounded?: boolean;
  /**
   * Type of caps. If `true`, draw round caps. Otherwise draw square caps.
   * @default false
   */
  capRounded?: boolean;
  /**
   * The maximum extent of a joint in ratio to the stroke width. Only works if `jointRounded` is `false`.
   * @default 4
   */
  miterLimit?: number;
  /**
   * If `true`, extrude the path in screen space (width always faces the camera).
   * If `false`, the width always faces up (z).
   * @default false
   */
  billboard?: boolean;
  /**
   * (Experimental) If `'loop'` or `'open'`, will skip normalizing the coordinates returned by `getPath` and instead assume all paths are to be loops or open paths.
   * When normalization is disabled, paths must be specified in the format of flat array. Open paths must contain at least 2 vertices and closed paths must contain at least 3 vertices.
   * @default null
   */
  _pathType?: null | 'loop' | 'open';
  /**
   * Path geometry accessor.
   */
  getPath?: AccessorFunction<DataT, PathGeometry>;
  /**
   * Path color accessor.
   * @default [0, 0, 0, 255]
   */
  getColor?: Accessor<DataT, Color | Color[]>;
  /**
   * The rgba color is in the format of `[r, g, b, [a]]`.
   * @default [0, 0, 255, 255]
   */
  getOutlineColor?: Accessor<DataT, Color>;
  /**
   * Path width accessor.
   * @default 1
   */
  getWidth?: Accessor<DataT, number | number[]>;
  /**
   * Width of each object
   * @default 0
   */
  getOutlineWidth?: Accessor<DataT, number>;
  /**
   * @deprecated Use `jointRounded` and `capRounded` instead
   */
  rounded?: boolean;
};

export type PathLayerProps<DataT = unknown> = _PathLayerProps<DataT> & LayerProps;

const DEFAULT_COLOR: [number, number, number, number] = [0, 0, 0, 255];

const defaultProps: DefaultProps<PathLayerProps> = {
  widthUnits: 'meters',
  widthScale: {type: 'number', min: 0, value: 1},
  widthMinPixels: {type: 'number', min: 0, value: 0},
  widthMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER},
  jointRounded: false,
  capRounded: false,
  miterLimit: {type: 'number', min: 0, value: 4},
  billboard: false,
  _pathType: null,

  getPath: {type: 'accessor', value: (object: any) => object.path},
  getColor: {type: 'accessor', value: DEFAULT_COLOR},
  getWidth: {type: 'accessor', value: 1},

  getOutlineColor: {type: 'accessor', value: DEFAULT_COLOR},
  getOutlineWidth: {type: 'accessor', value: 0},
  outlineWidthUnits: 'pixels',
  outlineMinPixels: {type: 'number', min: 0, value: 0},
  outlineMaxPixels: {type: 'number', min: 0, value: Number.MAX_SAFE_INTEGER},

  // deprecated props
  rounded: {deprecatedFor: ['jointRounded', 'capRounded']}
};

// const ATTRIBUTE_TRANSITION = {
//   enter: (value: TypedArray, chunk: TypedArray) => {
//     return (chunk.length ? chunk.subarray(chunk.length - value.length) : value);
//   }
// };
const ATTRIBUTE_TRANSITION = {
  enter: (toValue: NumericArray, chunk?: NumericArray): NumericArray => {
    if (chunk && chunk.length) {
      // Ensure both are TypedArray or both arrays
      if (ArrayBuffer.isView(toValue) && ArrayBuffer.isView(chunk)) {
        return (chunk as TypedArray).subarray(chunk.length - toValue.length);
      }
      // Fallback for plain number[]
      return chunk.slice(chunk.length - toValue.length) as number[];
    }
    return toValue;
  }
};

/** Render lists of coordinate points as extruded polylines with mitering. */
export default class OutPathLayer<DataT = any, ExtraPropsT extends {} = {}> extends Layer<
  ExtraPropsT & Required<_PathLayerProps<DataT>>
> {
  static defaultProps = defaultProps;
  static layerName = 'OutPathLayer';

  declare state: {
    model?: Model;
    pathTesselator: PathTesselator;
  };

  getShaders() {
    return super.getShaders({vs, fs, modules: [project32, picking, pathUniforms]}); // 'project' module added by default.
  }

  get wrapLongitude(): boolean {
    return false;
  }

  getBounds(): [number[], number[]] | null {
    return this.getAttributeManager()?.getBounds(['vertexPositions']);
  }

  initializeState() {
    const noAlloc = true;
    const attributeManager = this.getAttributeManager();
    /* eslint-disable max-len */
    attributeManager!.addInstanced({
      vertexPositions: {
        size: 3,
        // Start filling buffer from 1 vertex in
        vertexOffset: 1,
        type: 'float64',
        fp64: this.use64bitPositions(),
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getPath',
        // eslint-disable-next-line @typescript-eslint/unbound-method
        update: this.calculatePositions,
        noAlloc,
        shaderAttributes: {
          instanceLeftPositions: {
            vertexOffset: 0
          },
          instanceStartPositions: {
            vertexOffset: 1
          },
          instanceEndPositions: {
            vertexOffset: 2
          },
          instanceRightPositions: {
            vertexOffset: 3
          }
        }
      },
      instanceTypes: {
        size: 1,
        type: 'uint8',
        // eslint-disable-next-line @typescript-eslint/unbound-method
        update: this.calculateSegmentTypes,
        noAlloc
      },
      instanceStrokeWidths: {
        size: 1,
        accessor: 'getWidth',
        transition: ATTRIBUTE_TRANSITION,
        defaultValue: 1
      },
      instanceOutlineWidths: {
        size: 1,
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getOutlineWidth',
        defaultValue: 8
      },
      instanceColors: {
        size: this.props.colorFormat.length,
        type: 'unorm8',
        accessor: 'getColor',
        transition: ATTRIBUTE_TRANSITION,
        defaultValue: DEFAULT_COLOR
      },
      instanceOutlineColors: {
        size: this.props.colorFormat.length,
        type: 'unorm8',
        transition: ATTRIBUTE_TRANSITION,
        accessor: 'getOutlineColor',
        defaultValue: [0, 0, 0, 255]
      },
      instancePickingColors: {
        size: 4,
        type: 'uint8',
        accessor: (object, {index, target: value}) =>
          this.encodePickingColor(object && object.__source ? object.__source.index : index, value)
      }
    });
    /* eslint-enable max-len */

    this.setState({
      pathTesselator: new PathTesselator({
        fp64: this.use64bitPositions()
      })
    });
  }

  updateState(params: UpdateParameters<this>) {
    super.updateState(params);
    const {props, changeFlags} = params;

    const attributeManager = this.getAttributeManager();

    const geometryChanged =
      changeFlags.dataChanged ||
      (changeFlags.updateTriggersChanged &&
        (changeFlags.updateTriggersChanged.all || changeFlags.updateTriggersChanged.getPath));

    if (geometryChanged) {
      const {pathTesselator} = this.state;
      const buffers = (props.data as any).attributes || {};

      pathTesselator.updateGeometry({
        data: props.data,
        geometryBuffer: buffers.getPath,
        buffers,
        normalize: !props._pathType,
        loop: props._pathType === 'loop',
        getGeometry: props.getPath,
        positionFormat: props.positionFormat,
        wrapLongitude: props.wrapLongitude,
        // TODO - move the flag out of the viewport
        resolution: this.context.viewport.resolution,
        dataChanged: changeFlags.dataChanged
      });
      this.setState({
        numInstances: pathTesselator.instanceCount,
        startIndices: pathTesselator.vertexStarts
      });
      if (!changeFlags.dataChanged) {
        // Base `layer.updateState` only invalidates all attributes on data change
        // Cover the rest of the scenarios here
        attributeManager!.invalidateAll();
      }
    }

    if (changeFlags.extensionsChanged) {
      this.state.model?.destroy();
      this.state.model = this._getModel();
      attributeManager!.invalidateAll();
    }
  }

  getPickingInfo(params: GetPickingInfoParams): PickingInfo {
    const info = super.getPickingInfo(params);
    const {index} = info;
    const data = this.props.data as any[];

    // Check if data comes from a composite layer, wrapped with getSubLayerRow
    if (data[0] && data[0].__source) {
      // index decoded from picking color refers to the source index
      info.object = data.find((d) => d.__source.index === index);
    }
    return info;
  }

  /** Override base Layer method */
  disablePickingIndex(objectIndex: number) {
    const data = this.props.data as any[];

    // Check if data comes from a composite layer, wrapped with getSubLayerRow
    if (data[0] && data[0].__source) {
      // index decoded from picking color refers to the source index
      for (let i = 0; i < data.length; i++) {
        if (data[i].__source.index === objectIndex) {
          this._disablePickingIndex(i);
        }
      }
    } else {
      super.disablePickingIndex(objectIndex);
    }
  }

  draw() {
    const {
      jointRounded,
      capRounded,
      billboard,
      miterLimit,
      widthUnits,
      widthScale,
      widthMinPixels,
      widthMaxPixels,
      outlineWidthUnits,
      outlineMinPixels,
      outlineMaxPixels
    } = this.props;

    const model = this.state.model!;
    const pathProps: PathProps = {
      jointType: Number(jointRounded),
      capType: Number(capRounded),
      billboard,
      widthUnits: UNIT[widthUnits],
      widthScale,
      miterLimit,
      widthMinPixels,
      widthMaxPixels,
      outlineWidthUnits: UNIT[outlineWidthUnits],
      outlineMinPixels,
      outlineMaxPixels
    };
    model.shaderInputs.setProps({path: pathProps});
    model.draw(this.context.renderPass);
  }

  protected _getModel(): Model {
    /*
     *       _
     *        "-_ 1                   3                       5
     *     _     "o---------------------o-------------------_-o
     *       -   / ""--..__              '.             _.-' /
     *   _     "@- - - - - ""--..__- - - - x - - - -_.@'    /
     *    "-_  /                   ""--..__ '.  _,-` :     /
     *       "o----------------------------""-o'    :     /
     *      0,2                            4 / '.  :     /
     *                                      /   '.:     /
     *                                     /     :'.   /
     *                                    /     :  ', /
     *                                   /     :     o
     */

    // prettier-ignore
    const SEGMENT_INDICES = [
      // start corner
      0, 1, 2,
      // body
      1, 4, 2,
      1, 3, 4,
      // end corner
      3, 5, 4
    ];

    // [0] position on segment - 0: start, 1: end
    // [1] side of path - -1: left, 0: center (joint), 1: right
    // prettier-ignore
    const SEGMENT_POSITIONS = [
      // bevel start corner
      0, 0,
      // start inner corner
      0, -1,
      // start outer corner
      0, 1,
      // end inner corner
      1, -1,
      // end outer corner
      1, 1,
      // bevel end corner
      1, 0
    ];

    return new Model(this.context.device, {
      ...this.getShaders(),
      id: this.props.id,
      bufferLayout: this.getAttributeManager()!.getBufferLayouts(),
      geometry: new Geometry({
        topology: 'triangle-list',
        attributes: {
          indices: new Uint16Array(SEGMENT_INDICES),
          positions: {value: new Float32Array(SEGMENT_POSITIONS), size: 2}
        }
      }),
      isInstanced: true
    });
  }

  protected calculatePositions(attribute: Attribute) {
    const {pathTesselator} = this.state;

    attribute.startIndices = pathTesselator.vertexStarts;
    attribute.value = pathTesselator.get('positions');
  }

  protected calculateSegmentTypes(attribute: Attribute) {
    const {pathTesselator} = this.state;

    attribute.startIndices = pathTesselator.vertexStarts;
    attribute.value = pathTesselator.get('segmentTypes');
  }
}
