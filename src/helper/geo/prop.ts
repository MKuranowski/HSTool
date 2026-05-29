// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Feature, FeatureCollection, Geometry, Position } from "geojson";

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
 * Merges two GeoJSON Positions into one; returning new_ members, unless their null -
 * in which case the corresponding entry from old is used.
 */
export function mergePositions(old: Position, new_: (null | number)[]): Position {
    const len = Math.max(old.length, new_.length);
    const merged = new Array<number>(len);
    for (let i = 0; i < len; ++i) merged[i] = new_[i] ?? old[i];
    return merged;
}

export function hashCoords(
    c: Position,
    { precision = 6 }: { precision?: number | undefined } = {},
): string {
    return `${c[0].toFixed(precision)};${c[1].toFixed(precision)}`;
}
