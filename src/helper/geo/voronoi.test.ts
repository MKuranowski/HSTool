// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { MultiPolygon, Polygon, Position } from "geojson";
import { expect, test } from "vitest";
import { planarVoronoi } from "./voronoi";

function roundCoord(c: number): number {
    return Math.round(c * 10) / 10;
}

function roundPosition(p: Position): Position {
    return p.map(roundCoord);
}

function roundRing(r: Position[]): Position[] {
    return r.map(roundPosition);
}

function roundGeometry(geometry: Polygon | MultiPolygon): Polygon | MultiPolygon {
    switch (geometry.type) {
        case "Polygon":
            return {
                type: "Polygon",
                coordinates: geometry.coordinates.map(roundRing),
            };
        case "MultiPolygon":
            return {
                type: "MultiPolygon",
                coordinates: geometry.coordinates.map((polygon) => polygon.map(roundRing)),
            };
    }
}

test(planarVoronoi, () => {
    const points = turf.featureCollection([
        turf.point([20.5, 50.5], { id: "A" }),
        turf.point([20.5, 51.5], { id: "B" }),
        turf.point([21.5, 50.5], { id: "C" }),
        turf.point([21.5, 51.5], { id: "D" }),
    ]);
    const voronoi = planarVoronoi(points, { extent: [20, 50, 22, 52] });

    expect(voronoi.features.length).toStrictEqual(4);

    const a = voronoi.features[0];
    expect(a.properties).toStrictEqual({ id: "A" });
    expect(roundGeometry(a.geometry)).toStrictEqual({
        type: "Polygon",
        coordinates: [
            [
                [20, 50],
                [20, 51],
                [21, 51],
                [21, 50],
                [20, 50],
            ],
        ],
    });

    const b = voronoi.features[1];
    expect(b.properties).toStrictEqual({ id: "B" });
    expect(roundGeometry(b.geometry)).toStrictEqual({
        type: "Polygon",
        coordinates: [
            [
                [20, 52],
                [21, 52],
                [21, 51],
                [20, 51],
                [20, 52],
            ],
        ],
    });

    const c = voronoi.features[2];
    expect(c.properties).toStrictEqual({ id: "C" });
    expect(roundGeometry(c.geometry)).toStrictEqual({
        type: "Polygon",
        coordinates: [
            [
                [22, 50],
                [21, 50],
                [21, 51],
                [22, 51],
                [22, 50],
            ],
        ],
    });

    const d = voronoi.features[3];
    expect(d.properties).toStrictEqual({ id: "D" });
    expect(roundGeometry(d.geometry)).toStrictEqual({
        type: "Polygon",
        coordinates: [
            [
                [22, 52],
                [22, 51],
                [21, 51],
                [21, 52],
                [22, 52],
            ],
        ],
    });
});
