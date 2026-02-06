# @ubilabs/outlined-path-layer

![preview](./.github/assets/preview.png 'OutlinedPathlayer Preview')

A Deck.gl layer to render paths with outlines. This layer extends the functionality of the [PathLayer](https://deck.gl/docs/api-reference/layers/path-layer) to include customizable outlines.

See a working example [here](https://ubilabs-outlined-path-layer.storage.googleapis.com/index.html).
This layer is provided as-is, and we are not planning further development. Our goal is to support the integration of outline functionality directly into deck.gl.

## Installation

```bash
npm install @ubilabs/outlined-path-layer
```

## Usage

```javascript
import OutlinedPathLayer from '@ubilabs/outlined-path-layer';

const data = [
  {
    path: [
      [-122.45, 37.75],
      [-122.45, 37.8]
    ],
    color: [255, 0, 0]
  }
];

const layer = new OutlinedPathLayer({
  id: 'OutlinedPathLayer',
  data,
  getPath: (d) => d.path,
  getColor: (d) => d.color,
  getWidth: 5,
  getOutlineColor: [0, 0, 0, 255],
  getOutlineWidth: 2
});
```

## Properties

The `OutlinedPathLayer` supports all properties of the [PathLayer](https://deck.gl/docs/api-reference/layers/path-layer#properties). In addition, it provides the following properties for outline customization, which can accept either a constant value or an [accessor function](https://deck.gl/docs/developer-guide/using-layers#accessors), similar to `getPath`, `getColor`, and `getWidth`:

- **`getOutlineColor`** (Color | Accessor<DataT, Color>, optional): The rgba color of the outline in the format `[r, g, b, [a]]`. Can be a constant color or an accessor function that returns a color for each object. Default is `[0, 0, 0, 255]`.
- **`getOutlineWidth`** (number | Accessor<DataT, number>, optional): The width of the outline. Can be a constant width or an accessor function that returns a width for each object. Default is `0`.
- **`outlineWidthUnits`** (Unit, optional): The units of the outline width, one of `'meters'`, `'common'`, and `'pixels'`. Default is `'pixels'`.
- **`outlineMinPixels`** (number, optional): The minimum outline width in pixels. Default is `0`.
- **`outlineMaxPixels`** (number, optional): The maximum outline width in pixels. Default is `Number.MAX_SAFE_INTEGER`.

## Contributing

While active feature development for this standalone layer is not planned, contributions for bug fixes, performance improvements, and documentation are welcome in the form of Issues and Pull Requests.
Please open an issue to discuss a new feature to implement first before opening a corresponding PR.
