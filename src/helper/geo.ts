// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type {
    Feature,
    FeatureCollection,
    Geometry,
    LineString,
    MultiPolygon,
    Point,
    Polygon,
    Position,
} from "geojson";

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

/**
 * Merges properties of a feature with the provided object.
 */
export function withProperties<
    G extends Geometry,
    P1 extends { [name: string]: unknown },
    P2 extends { [name: string]: unknown },
>(feature: Feature<G, P1>, newProps: P2): Feature<G, P1 & P2> {
    return {
        ...feature,
        properties: { ...feature.properties, ...newProps },
    };
}

/**
 * Returns a new FeatureCollection, with properties of each feature extended by values returned
 * from the provided callback.
 */
export function withPropertiesInCollection<
    G extends Geometry,
    P1 extends { [name: string]: unknown },
    P2 extends { [name: string]: unknown },
>(
    collection: FeatureCollection<G, P1>,
    newProps: (f: Feature<G, P1>) => P2,
): FeatureCollection<G, P1 & P2> {
    return {
        type: "FeatureCollection",
        features: collection.features.map((feature) => withProperties(feature, newProps(feature))),
    };
}

/**
 * Creates `categorizer` function for `withPossibleAnswers` for binary-splitting questions,
 * based on distance comparison.
 *
 * If `dist` returns a negative number, `[neg]` is returned; otherwise `[pos]` is returned.
 * However if `Math.abs(dist) <= tolerance`, both answers are returned.
 */
export function binaryCategorizer<
    Negative extends string,
    Positive extends string,
    Props extends { [name: string]: unknown },
>(
    dist: (s: Feature<Point, Props>) => number,
    tolerance: number,
    neg: Negative,
    pos: Positive,
): (s: Feature<Point, Props>) => (Negative | Positive)[] {
    return (s) => {
        const d = dist(s);
        if (Math.abs(d) <= tolerance) return [neg, pos];
        return [d < 0 ? neg : pos];
    };
}

/**
 * Creates a new FeatureCollection with each feature's "possibleAnswers" property set to
 * the result of calling `categorize` on that feature.
 */
export function withPossibleAnswers<
    Props extends { [name: string]: unknown },
    Answer extends string,
>(
    collection: FeatureCollection<Point, Props>,
    categorize: (s: Feature<Point, Props>) => Answer[],
): FeatureCollection<Point, Props & { possibleAnswers: Answer[] }> {
    return withPropertiesInCollection(collection, (s) => {
        return { possibleAnswers: categorize(s) };
    });
}

export function mergePositions(old: Position, new_: (null | number)[]): Position {
    const len = Math.max(old.length, new_.length);
    const merged = new Array<number>(len);
    for (let i = 0; i < len; ++i) merged[i] = new_[i] ?? old[i];
    return merged;
}
