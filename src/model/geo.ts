// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Geometry, MultiPolygon, Polygon } from "geojson";

/** Any area geometry - either a Polygon or MultiPolygon. */
export type Area = Polygon | MultiPolygon;

/** Narrowed, two-dimensional position tuple. */
export type Position = [lon: number, lat: number];

/** Type alias for an array of geometry type identifiers. */
export type GeometryTypes = readonly Geometry["type"][];

/** Infer the full Geometry from an array of geometry type identifiers. */
export type GeometryOf<T extends GeometryTypes> = Extract<Geometry, { type: T[number] }>;
