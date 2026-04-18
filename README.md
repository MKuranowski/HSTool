# HSTool

HSTool is an under-construction tool for seekers playing
[Jet Lag: The Game — Hide and Seek Transit Game](https://store.nebula.tv/collections/jetlag/products/hideandseek).

## TODO

- [x] Questions & station filtering
- [x] Permanent background overlay
- [x] Show hiding zones
- [x] Voronoi diagrams of staging questions
- [ ] Timing
- [ ] Alternative units
- [ ] Voronoi-based end game
- [ ] Better state shareability:
    - [ ] Questions and options as well; not just the Preset
    - [ ] Load from URL
    - [ ] Copy to clipboard
    - [ ] Pastebin (?)
- [x] Palette gives out the same color past the end of pre-defined colors
- [x] Clean-up, organize and test the mess in helper/geo
- [ ] Show answer names (not ids) in station popups when staging a question
- [ ] Show thermometer end coordinates
- [ ] Make every map layer toggleable (through Leaflet's LayersControl)

## How to create a preset?

In order to use HSTool, you need a *preset* defining all stations, airports, parks, libraries,
cinemas, etc. Currently, the only way to load a preset into the tool is through the clipboard.

Unfortunately, currently creating a preset requires technical skills, as you must be able
to create a JSON file on your own, most likely with a little bit of scripting. The preset must
conform to the following schema, described as a [TypeScript interface](https://www.typescriptlang.org/docs/handbook/interfaces.html)
with the help of [GeoJSON types](https://www.npmjs.com/package/@types/geojson). IDs must be unique
within each collection.

```ts
interface Preset {
    name: string;

    stations: FeatureCollection<Point, { id: string; name: string }>;

    // Point collections can be used in "Match-Point", "Measure" and "Tentacle" questions.
    // Examples include "Airports", "Cinemas" or "Parks".
    points?: Record<string, FeatureCollection<Point, { id: string; name?: string }>>;

    // Line collections can be used in "Measure" questions.
    // Examples include "Coastline" or "International Borders".
    lines?: Record<string, FeatureCollection<LineString, { id: string }>>;

    // Area collections can be used in "Match-Area" questions.
    // Examples include "Landmasses" or "3rd Admin Divisions".
    // Polygons within each collection should not overlap.
    areas?: Record<string, FeatureCollection<Polygon | MultiPolygon, { id: string; name?: string }>>;

    // Overlay can be used to draw something immediately above map tiles,
    // like transit lines available during the game.
    // Features may be styled using simplestyle: https://github.com/mapbox/simplestyle-spec
    // Point-like features are currently not displayed.
    overlay?: FeatureCollection;
}
```

## Development

HSTool is a single-page application written using React, Bootstrap, Leaflet and Vite.
[pnpm](https://pnpm.io/) is required to build and develop the application.

* `pnpm dev` starts the application in development mode with hot reload,
* `pnpm test` runs unit tests,
* `pnpm lint` checks the code,
* `pnpm build` builds the application in release mode for distribution under the `dist` folder.

Note that because of React and nanostores immutability constraints, the app is not built with
standard object-oriented paradigms; even though this problem could benefit from those.

Rather, this app relies heavily on immutable POJO objects, and helper modules to operate on those.
Instead of a `Question` class with a `categorize` method, the app has a `Question` module/namespace,
with a `T` interface for the POJO description and a `categorize` function. This is a bit similar
to working with numbers in JS, as one would do `Math.sin(0.5)`, not `(0.5).sin()`.

Immutability is not strictly enforced, as it's still useful in a lot of places, however
programmers need to keep in mind that *stored* objects are immutable. `$object.get().position = ...`
won't work, one must do `$object.set({ ...$object.get(), position: ... })`. Similar constraints
apply to variables from `useStore`, on which mutations will not be propagated.

To help with stored objects which might be only partially mutated, use [nanostore's map](https://github.com/nanostores/nanostores?tab=readme-ov-file#maps),
or helper mixins `arrayAtom` or `setAtom` from <src/helper/store.ts>.

## License

HSTool is distributed under GNU GPL v3 (or any later version).

> © Copyright 2026 Mikołaj Kuranowski
>
> HSTool is free software: you can redistribute it and/or modify
> it under the terms of the GNU General Public License as published by
> the Free Software Foundation; either version 3 of the License, or
> (at your option) any later version.
>
> HSTool is distributed in the hope that it will be useful,
> but WITHOUT ANY WARRANTY; without even the implied warranty of
> MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
> GNU General Public License for more details.
>
> You should have received a copy of the GNU General Public License
> along with HSTool. If not, see <http://www.gnu.org/licenses/>.
