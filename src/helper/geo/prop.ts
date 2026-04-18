// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Feature, FeatureCollection, Geometry, Point, Position } from "geojson";

/**
 * Merges properties of a feature with the provided object.
 */
export function withProperties<G extends Geometry, P1 extends object, P2 extends object>(
    feature: Feature<G, P1>,
    newProps: P2,
): Feature<G, P1 & P2> {
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
    P1 extends object,
    P2 extends object,
>(
    collection: FeatureCollection<G, P1>,
    newProps: (f: Feature<G, P1>) => P2,
): FeatureCollection<G, P1 & P2> {
    return {
        ...collection,
        features: collection.features.map((f) => withProperties(f, newProps(f))),
    };
}

/**
 * Creates a new FeatureCollection with each feature's "possibleAnswers" property set to
 * the result of calling `categorize` on that feature.
 */
export function withPossibleAnswers<Props extends object, Answer extends string>(
    collection: FeatureCollection<Point, Props>,
    categorize: (f: Feature<Point, Props>) => Answer[],
): FeatureCollection<Point, Props & { possibleAnswers: Answer[] }> {
    return withPropertiesInCollection(collection, (f) => ({ possibleAnswers: categorize(f) }));
}

/**
 * Creates `categorizer` function for `withPossibleAnswers` for binary-splitting questions,
 * based on distance comparison.
 *
 * If `dist` returns a negative number, `[negative]` is returned; otherwise `[positive]` is returned.
 * However if `Math.abs(dist) <= tolerance`, both answers are returned.
 */
export function binaryCategorizer<
    Negative extends string,
    Positive extends string,
    Props extends object,
>(
    dist: (f: Feature<Point, Props>) => number,
    tolerance: number,
    negative: Negative,
    positive: Positive,
): (f: Feature<Point, Props>) => (Negative | Positive)[] {
    return (feature) => {
        const d = dist(feature);
        if (Math.abs(d) <= tolerance) return [negative, positive];
        return [d < 0 ? negative : positive];
    };
}

/**
 * Merges two GeoJSON Positions into one; returning new_ members, unless their null -
 * in which case the corresponding entry from old is used.
 */
export function mergePositions(old: Position, new_: (null | number)[]): Position {
    const len = Math.max(old.length, new_.length);
    const merged = new Array<number>(len);
    for (let i = 0; i < len; ++i) merged[i] = new_[i] ?? old[i];
    return merged;
}
