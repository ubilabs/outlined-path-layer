import {Color} from '@deck.gl/core';

import {GoogleMapsOverlay} from '@deck.gl/google-maps';
import {loadMapsApi} from './load-maps-api';

import tripsData from './trips.json';

import OutlinedPathLayer from './outlined-path-layer/outlined-path-layer';

interface CoordWithTimeStamp extends google.maps.LatLngLiteral {
  timestamp: number | string;
}
interface BasicTrip {
  UUID: string;
  dateStart: number | string;
  coords: Array<CoordWithTimeStamp>;
  color: Array<number> | string;
}

type Trip<T> = BasicTrip & {latLng?: google.maps.LatLngLiteral} & T;
type CustomTrip = Trip<{name: string}>;

const location = {
  center: {
    lat: 53.85,
    lng: 13.48
  },
  zoom: 12,
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

interface LayerSettings {
  getWidth: number;
  getOutlineWidth: number;
  widthUnits: 'pixels' | 'meters';
  outlineWidthUnits: 'pixels' | 'meters';
  outlineColor: string;
  widthMinPixels: number;
  widthMaxPixels: number;
  outlineMinPixels: number;
  outlineMaxPixels: number;
  capRounded: boolean;
  jointRounded: boolean;
  miterLimit: number;
}

const settings: LayerSettings = {
  getWidth: 6,
  getOutlineWidth: 2,
  widthUnits: 'pixels',
  outlineWidthUnits: 'pixels',
  outlineColor: '#000000',
  widthMinPixels: 4,
  widthMaxPixels: 20,
  outlineMinPixels: 1,
  outlineMaxPixels: 10,
  capRounded: true,
  jointRounded: true,
  miterLimit: 4
};

async function setGoogleMap() {
  await loadMapsApi({
    key: import.meta.env.VITE_GOOGLE_MAPS_KEY
  });

  map = new google.maps.Map(document.querySelector('#app')!, {
    disableDefaultUI: true,
    backgroundColor: 'transparent',
    gestureHandling: 'greedy',
    clickableIcons: false,
    mapId: 'ace40485e56020778d9611f7',
    colorScheme: google.maps.ColorScheme.DARK,
    center: location.center,
    zoom: location.zoom
  });

  google.maps.event.addListenerOnce(map, 'idle', async () => {
    overlay.setMap(map);
  });
}

async function main() {
  await setGoogleMap();
  createConfigPanel();
  setLayer();
}

main();

function createConfigPanel() {
  const configPanel = document.getElementById('config-panel');
  if (!configPanel) return;

  const createSlider = (
    id: string,
    label: string,
    min: string,
    max: string,
    step: string,
    value: number,
    onUpdate: (value: number) => void
  ) => {
    const container = document.createElement('div');
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.innerText = label;
    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = id;
    slider.min = min;
    slider.max = max;
    slider.step = step;
    slider.value = String(value);
    const valueLabel = document.createElement('span');
    valueLabel.innerText = String(value);
    slider.addEventListener('input', (e) => {
      const newValue = parseFloat((e.target as HTMLInputElement).value);
      valueLabel.innerText = String(newValue);
      onUpdate(newValue);
    });
    container.append(labelEl, slider, valueLabel);
    return container;
  };

  const createDropdown = <T extends string>(
    id: string,
    label: string,
    options: T[],
    value: T,
    onUpdate: (value: T) => void
  ) => {
    const container = document.createElement('div');
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.innerText = label;
    const select = document.createElement('select');
    select.id = id;
    options.forEach((option) => {
      const optionEl = document.createElement('option');
      optionEl.value = option;
      optionEl.innerText = option;
      if (option === value) {
        optionEl.selected = true;
      }
      select.appendChild(optionEl);
    });
    select.addEventListener('change', (e) => onUpdate((e.target as HTMLSelectElement).value as T));
    container.append(labelEl, select);
    return container;
  };

  const createColorPicker = (
    id: string,
    label: string,
    value: string,
    onUpdate: (value: string) => void
  ) => {
    const container = document.createElement('div');
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.innerText = label;
    const colorPicker = document.createElement('input');
    colorPicker.type = 'color';
    colorPicker.id = id;
    colorPicker.value = value;
    colorPicker.addEventListener('input', (e) => onUpdate((e.target as HTMLInputElement).value));
    container.append(labelEl, colorPicker);
    return container;
  };

  const createCheckbox = (
    id: string,
    label: string,
    value: boolean,
    onUpdate: (value: boolean) => void
  ) => {
    const container = document.createElement('div');
    const labelEl = document.createElement('label');
    labelEl.htmlFor = id;
    labelEl.innerText = label;
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = id;
    checkbox.checked = value;
    checkbox.addEventListener('change', (e) => onUpdate((e.target as HTMLInputElement).checked));
    container.append(labelEl, checkbox);
    return container;
  };

  const widthSlider = createSlider('width', 'Width', '0', '20', '1', settings.getWidth, (value) => {
    settings.getWidth = value;
    setLayer();
  });

  const widthUnitsDropdown = createDropdown(
    'widthUnits',
    'Width Units',
    ['pixels', 'meters'],
    settings.widthUnits,
    (value) => {
      settings.widthUnits = value;
      setLayer();
    }
  );

  const outlineWidthSlider = createSlider(
    'outlineWidth',
    'Outline Width',
    '0',
    '10',
    '2',
    settings.getOutlineWidth,
    (value) => {
      settings.getOutlineWidth = value;
      setLayer();
    }
  );

  const outlineWidthUnitsDropdown = createDropdown(
    'outlineWidthUnits',
    'Outline Width Units',
    ['pixels', 'meters'],
    settings.outlineWidthUnits,
    (value) => {
      settings.outlineWidthUnits = value;
      setLayer();
    }
  );

  const outlineColorPicker = createColorPicker(
    'outlineColor',
    'Outline Color',
    settings.outlineColor,
    (value) => {
      settings.outlineColor = value;
      setLayer();
    }
  );

  const widthMinPixelsSlider = createSlider(
    'widthMinPixels',
    'Width Min Pixels',
    '0',
    '20',
    '1',
    settings.widthMinPixels,
    (value) => {
      settings.widthMinPixels = value;
      setLayer();
    }
  );

  const widthMaxPixelsSlider = createSlider(
    'widthMaxPixels',
    'Width Max Pixels',
    '0',
    '50',
    '1',
    settings.widthMaxPixels,
    (value) => {
      settings.widthMaxPixels = value;
      setLayer();
    }
  );

  const outlineMinPixelsSlider = createSlider(
    'outlineMinPixels',
    'Outline Min Pixels',
    '0',
    '10',
    '1',
    settings.outlineMinPixels,
    (value) => {
      settings.outlineMinPixels = value;
      setLayer();
    }
  );

  const outlineMaxPixelsSlider = createSlider(
    'outlineMaxPixels',
    'Outline Max Pixels',
    '0',
    '20',
    '1',
    settings.outlineMaxPixels,
    (value) => {
      settings.outlineMaxPixels = value;
      setLayer();
    }
  );

  const capRoundedCheckbox = createCheckbox(
    'capRounded',
    'Cap Rounded',
    settings.capRounded,
    (value) => {
      settings.capRounded = value;
      setLayer();
    }
  );

  const jointRoundedCheckbox = createCheckbox(
    'jointRounded',
    'Joint Rounded',
    settings.jointRounded,
    (value) => {
      settings.jointRounded = value;
      setLayer();
    }
  );

  const miterLimitSlider = createSlider(
    'miterLimit',
    'Miter Limit',
    '1',
    '10',
    '1',
    settings.miterLimit,
    (value) => {
      settings.miterLimit = value;
      setLayer();
    }
  );

  configPanel.append(
    widthSlider,
    widthUnitsDropdown,
    outlineWidthSlider,
    outlineWidthUnitsDropdown,
    outlineColorPicker,
    widthMinPixelsSlider,
    widthMaxPixelsSlider,
    outlineMinPixelsSlider,
    outlineMaxPixelsSlider,
    capRoundedCheckbox,
    jointRoundedCheckbox,
    miterLimitSlider
  );
}

function hexToRgb(hex: string): Color {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

function setLayer() {
  const {
    widthUnits,
    getWidth,
    widthMinPixels,
    widthMaxPixels,
    outlineWidthUnits,
    getOutlineWidth,
    outlineMinPixels,
    outlineMaxPixels,
    outlineColor,
    capRounded,
    jointRounded,
    miterLimit
  } = settings;

  const getOutlineColor = hexToRgb(outlineColor);

  const trips = new OutlinedPathLayer<CustomTrip>({
    id: 'OutlinedPathLayer',
    data: tripsData,
    getPath: (trip: CustomTrip) =>
      trip.coords.map((coord) => [coord.lng + 1, coord.lat] as [number, number]),
    getColor: (trip: CustomTrip) =>
      (Array.isArray(trip.color)
        ? trip.color
        : [255 * Math.random(), 255 * Math.random(), 255 * Math.random()]) as Color,
    widthUnits,
    getWidth,
    widthMinPixels,
    widthMaxPixels,
    capRounded,
    jointRounded,
    miterLimit,
    outlineWidthUnits,
    getOutlineWidth,
    outlineMinPixels,
    outlineMaxPixels,
    getOutlineColor
  });

  overlay.setProps({
    layers: [trips]
  });
}
