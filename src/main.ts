import {Color, Deck, MapViewState, Position} from '@deck.gl/core';

import OutlineLayer from './outline-layer/outline-layer';
import OutPathLayer from './outpath-layer/outpath-layer';
import {GoogleMapsOverlay} from '@deck.gl/google-maps';
import {loadMapsApi} from './load-maps-api';

import tripsData from './trips.json';
import {PathLayer} from '@deck.gl/layers';
import {PathOutlineExtension} from './path-outline-extension';
import OutlinedPathLayer from './outlined-path-layer/outlined-path-layer';

interface CoordWithTimeStamp extends google.maps.LatLngLiteral {
  timestamp: number | string;
}
interface BasicTrip {
  UUID: string;
  dateStart: number | string;
  coords: Array<CoordWithTimeStamp>;
  /** Supports rgb array [r, g, b], rgb string "rgb(r, g, b)" and hex colors "#ff0000".
   * Note: The colors are internally converted to the rgb array format as deck.gl requires that
   * format for its colors
   */
  color: Array<number> | string;
}

type Trip<T> = BasicTrip & {latLng?: google.maps.LatLngLiteral} & T;
type CustomTrip = Trip<{name: string}>;

type DataType = {
  positions: Position[];
  color: Color;
};

const betrikoLocation = {
  center: {
    lat: 53.87415993211935,
    lng: 12.576841926483503
  },
  zoom: 10.5,
  heading: 0,
  tilt: 0,
  bounds: {
    south: 53.8737300850061,
    west: 12.575545760325978,
    north: 53.87458977481448,
    east: 12.578138092641028
  }
};
let overlay = new GoogleMapsOverlay({
  interleaved: true
});

let map: google.maps.Map;

async function setGoogleMap() {
  await loadMapsApi({
    key: import.meta.env.VITE_GOOGLE_MAPS_KEY
  });

  map = new google.maps.Map(document.querySelector('#app')!, {
    disableDefaultUI: true,
    backgroundColor: 'transparent',
    gestureHandling: 'greedy',
    clickableIcons: false,
    mapId: '728c4c153ce32f8',
    mapTypeId: 'hybrid',
    center: betrikoLocation.center,
    zoom: betrikoLocation.zoom
  });

  google.maps.event.addListenerOnce(map, 'idle', async () => {
    overlay.setMap(map);
  });
}

async function main() {
  await setGoogleMap();
  setLayers();
}

main();

function setLayers() {
  const data: DataType[] = [
    {
      positions: [
        [0, 1],
        [0, -1]
      ],
      color: [12, 127, 188]
    },
    {
      positions: [
        [-1, -1],
        [1, 2]
      ],
      color: [255, 255, 128]
    },
    {
      positions: [
        [1, 1],
        [-1, -1]
      ],
      color: [209, 178, 12]
    }
  ];

  // const getOutlineColor = (d: DataType) => d.color.toReversed() as Color;
  const getOutlineColor: Color = [24, 24, 24];

  const noneOutlineLayer = new OutlineLayer<DataType>({
    id: 'none_outline',
    data,
    parameters: {
      // @ts-expect-error
      depthTest: false
    },
    getSourcePosition: (d) => [d.positions[0][0] - 2, d.positions[0][1]],
    getTargetPosition: (d) => [d.positions[1][0] - 2, d.positions[1][1]],
    getColor: (d) => d.color,
    getOutlineColor,
    capType: 'none',
    getWidth: 100,
    widthMinPixels: 10,
    getOutlineWidth: 4,
    widthUnits: 'meters',
    outlineWidthUnits: 'meters',
    outlineMinPixels: 2
    // outlineMaxPixels: 12
  });

  const flatOutlineLayer = new OutlineLayer<DataType>({
    id: 'flat_outline',
    data,
    parameters: {
      // @ts-expect-error
      depthTest: false
    },
    getSourcePosition: (d) => d.positions[0],
    getTargetPosition: (d) => d.positions[1],
    getColor: (d) => d.color,
    getOutlineColor,
    capType: 'flat',
    getWidth: 100,
    widthMinPixels: 10,
    getOutlineWidth: 4,
    widthUnits: 'meters',
    outlineWidthUnits: 'pixels',
    outlineMinPixels: 2,
    outlineMaxPixels: 12
  });

  const roundOutlineLayer = new OutlineLayer<DataType>({
    parameters: {
      // @ts-expect-error
      depthTest: true
    },
    id: 'round_outline',
    data,
    getSourcePosition: (d) => [d.positions[0][0] + 2, d.positions[0][1]],
    getTargetPosition: (d) => [d.positions[1][0] + 2, d.positions[1][1]],
    getColor: (d) => d.color,
    getOutlineColor,
    capType: 'round',
    getWidth: 100,
    widthMinPixels: 10,
    getOutlineWidth: 20,
    widthUnits: 'meters',
    outlineWidthUnits: 'pixels',
    outlineMinPixels: 12,
    outlineMaxPixels: 200
    // outlineMaxPixels: 12
  });

  const flatOutPathLayer = new OutPathLayer<DataType>({
    id: 'flat_outpath',
    data: [
      {
        positions: [
          [-1, 0],
          [1, 0],
          [2, 1]
        ],
        color: [12, 255, 128]
      }
    ],
    getPath: (d: DataType) => d.positions,
    getWidth: 100,
    widthMinPixels: 10,
    widthUnits: 'meters',
    getColor: (d: DataType) => d.color,
    capRounded: !true,
    jointRounded: !true,
    getOutlineColor,
    getOutlineWidth: 10,
    outlineWidthUnits: 'meters',
    outlineMinPixels: 5,
    outlineMaxPixels: 400
    // billboard: true
  });

  const roundOutPathLayer = new OutPathLayer<DataType>({
    data: [
      {
        positions: [
          [-1, 0.02],
          [1, 0.02],
          [2, 1.02],
          [3, 1.02]
        ],
        color: [255, 64, 128]
      },
      {
        positions: [
          [-1, 0.02],
          [-1, 1.02],
          [0, 1.02],
          [1, -1.02]
        ],
        color: [18, 22, 198]
      }
    ],
    getPath: (d) => d.positions,
    getWidth: 6,
    widthMinPixels: 10,
    widthUnits: 'pixels',
    getColor: (d) => d.color,
    capRounded: true,
    jointRounded: true,
    getOutlineColor,
    getOutlineWidth: 4,
    outlineWidthUnits: 'meters'
    // outlineMinPixels: 15
    // outlineMaxPixels: 30
    // outlineMinPixels: 4,
    // outlineMaxPixels: 30
  });

  // const deckInstance = new Deck({
  //   initialViewState: INITIAL_VIEW_STATE,
  //   controller: true
  // });

  const trips = new OutPathLayer<CustomTrip>({
    id: 'newId',
    data: tripsData,
    getPath: (trip: CustomTrip) =>
      trip.coords.map((coord) => [coord.lng, coord.lat] as [number, number]),
    getColor: (trip: CustomTrip) =>
      (Array.isArray(trip.color)
        ? trip.color
        : [255 * Math.random(), 255 * Math.random(), 255 * Math.random()]) as Color,
    widthUnits: 'pixels',
    getWidth: 6,
    widthMinPixels: 4,
    capRounded: true,
    jointRounded: true,
    miterLimit: 1,
    outlineWidthUnits: 'pixels',
    getOutlineWidth: 2,
    outlineMinPixels: 1,
    getOutlineColor: [0, 0, 0]
  });

  const trips2 = new OutlinedPathLayer<CustomTrip>({
    id: 'newId2',
    data: tripsData,
    getPath: (trip: CustomTrip) =>
      trip.coords.map((coord) => [coord.lng + 1, coord.lat] as [number, number]),
    getColor: (trip: CustomTrip) =>
      (Array.isArray(trip.color)
        ? trip.color
        : [255 * Math.random(), 255 * Math.random(), 255 * Math.random()]) as Color,
    widthUnits: 'pixels',
    getWidth: 6,
    widthMinPixels: 4,
    capRounded: true,
    jointRounded: true,
    outlineWidthUnits: 'pixels',
    getOutlineWidth: 2,
    outlineMinPixels: 1,
    getOutlineColor: [0, 0, 0]
  });

  overlay.setProps({
    layers: [
      trips,
      trips2,
      noneOutlineLayer,
      flatOutlineLayer,
      roundOutlineLayer,
      flatOutPathLayer,
      roundOutPathLayer
    ]
  });
}
