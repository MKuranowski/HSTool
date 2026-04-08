# HSTool

HSTool is an under-construction tool for playing
[Jet Lag: The Game — Hide and Seek Transit Game](https://store.nebula.tv/collections/jetlag/products/hideandseek).

## Running

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
