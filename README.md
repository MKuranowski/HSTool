# HSTool

HSTool is an under-construction tool for seekers playing
[Jet Lag: The Game — Hide and Seek Transit Game](https://store.nebula.tv/collections/jetlag/products/hideandseek).

## TODO

- [x] Questions & station filtering
- [x] Permanent background overlay
- [x] Show hiding zones
- [x] Voronoi diagrams of staging questions
- [ ] Timing
    - [x] Save question timestamps
    - [x] Compute game time - including card bonuses and quick answer bonuses
    - [ ] Rest Periods
    - [ ] Update Question.askedAt when a question is copied to clipboard
- [ ] Alternative units
- [x] Voronoi-based end game
- [ ] Better state shareability:
    - [ ] Questions and options as well; not just the Preset
    - [ ] Load from URL
    - [ ] Copy to clipboard
    - [ ] Pastebin (?)
- [x] Palette gives out the same color past the end of pre-defined colors
- [x] Clean-up, organize and test the mess in helper/geo
- [x] Show answer names (not ids) in station popups when staging a question
- [x] Show thermometer end coordinates
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

    // In kilometers, defaults to 0.5
    hidingRadius?: number,

    // Time in minutes for the hider to answer a question, defaults to 5
    answerTime?: number,

    // Time in minutes for the hider to answer a photo question, defaults to 10
    photoAnswerTime?: number,

    // Multiplier for calculating time bonuses for quick answers, defaults to 0
    // (disabled). The bonus is truncated (rounded down) to nearest minute for
    // each question.
    //
    // For example, if a hider answers a photo question with 5 minutes left over,
    // and this multiplier is set to 0.5, 2 minutes = ⌊2.5⌋ = ⌊5 * 0.5⌋ is added
    // to their total hiding time.
    quickAnswerMultiplier: number,

    stations: FeatureCollection<Point, { id: string; name: string }>;

    // Point collections can be used in "Match-Point", "Measure" and "Tentacle" questions.
    // Examples include "airport", "cinema" or "park".
    points?: Record<string, FeatureCollection<Point, { id: string; name?: string }>>;

    // Line collections can be used in "Measure" questions.
    // Examples include "coastline" or "international border".
    lines?: Record<string, FeatureCollection<LineString, { id: string }>>;

    // Area collections can be used in "Match-Area" questions.
    // Examples include "landmass" or "3rd admin division".
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
[Deno](https://deno.com/) is required to build and develop the application.

* `deno task dev` starts the application in development mode with hot reload,
* `deno task test` runs unit tests,
* `deno task lint` checks the code,
* `deno task build` builds the application in release mode for distribution under the `dist` folder.


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
