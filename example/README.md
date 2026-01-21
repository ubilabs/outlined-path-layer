# Outlined Path Layer Example

This directory contains an example application demonstrating the usage of the `@ubilabs/outlined-path-layer` with Deck.gl and Google Maps.

See live [here](https://outlinedpathlayer-example.storage.googleapis.com/index.html).

## Setup

Follow these steps to get the example running locally:

1.  **Clone the repository**

    If you haven't already, clone the main repository:

    ```bash
    git clone https://github.com/your-username/outlined-path-layer.git
    cd outlined-path-layer
    ```

2.  **Install root dependencies and start `tsdown` in watch mode**

    Navigate to the root of the repository and install the dependencies. Then, start `tsdown` in watch mode to automatically rebuild the layer whenever changes are made.

    ```bash
    npm install
    npm run build -- --watch
    # or simply: npx tsdown --watch
    ```

    Keep this process running in a separate terminal window.

3.  **Install example dependencies**

    Navigate into the `example` directory and install its dependencies:

    ```bash
    cd example
    npm install
    ```

    This will link the `@ubilabs/outlined-path-layer` package from your local `dist` folder into the example's `node_modules`.

4.  **Run the example**

    From the `example` directory, start the development server:

    ```bash
    npm run dev
    ```

    The example application should now be running, and any changes you make to the `outlined-path-layer` source code will be automatically reflected in the example due to `tsdown`'s watch mode.
