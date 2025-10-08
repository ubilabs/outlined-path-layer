# Outlined Path Layer

Repository includes two variants of the PathLayer with Outlined:

- The initial implementation as a standalone layer based on a simple copy PathLayer, named OutPathLayer
- OutlinedPathLayer as a subclassed layer from PathLayer

The current example copies the configuration used in the Betreiko project's TripsLayer, as this was the initial motivation for this.

## TODOS

- Move back away from actual glsl files to TS files to match the default deckgl setup
- Refactor OutlinedPathLayer to be its own package to be imported in the example
- clean up outline layer and include in repo
