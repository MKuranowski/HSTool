// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Feature, LineString, MultiPolygon, Point, Polygon, Position } from "geojson";
import * as turf from "@turf/turf";

/**
 * Calculates the distance from a Position to any other Feature.
 *
 * For non-point features, calculates the distance to the nearest edge of that feature.
 * If the position is within the feature, the returned distance negative.
 */
export function distanceToFeature(
    pt: Position,
    f: Feature<Point | LineString | Polygon | MultiPolygon>,
): number {
    switch (f.geometry.type) {
        case "Point":
            return turf.distance(pt, f.geometry.coordinates);

        case "LineString":
            return turf.pointToLineDistance(pt, f.geometry);

        case "Polygon":
        case "MultiPolygon":
            return turf.pointToPolygonDistance(pt, f.geometry);
    }
}
