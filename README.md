# OutlinedPathLayer

Repository includes two variants of the PathLayer with Outlines:

- OutlinedPathLayer as a subclassed layer from PathLayer
- The initial implementation as a standalone layer based on a simple copy PathLayer, named OutPathLayer

## Development

The current example copies the configuration used in the Betriko project's TripsLayer, as this was the initial motivation for this.

The example uses the code for the layer that is in this project, so local development of the layer works intuitively.

Clone the repository and install dependencies

```
git clone https://github.com/ubilabs/outlined-path-layer
npm i
```

Create an `.env`file

```
VITE_GOOGLE_MAPS_KEY=<API-KEY>
```

Start the local development server

```
npm run dev
```

## Deployment / Publishing

The example has to be deployed manually using the `deploy` script in the `package.json`

Publishing the layer package works by making a new release on Github.
