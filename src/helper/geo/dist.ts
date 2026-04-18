// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type {
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    LineString,
    MultiPolygon,
    Point,
    Polygon,
    Position,
} from "geojson";

const earthRadiusKm = turf.earthRadius / 1000;

/**
 * Calculates the distance from a Position to any other Feature.
 *
 * For non-point features, calculates the distance to the nearest edge of that feature.
 * If the position is within the feature, the returned distance is negative.
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
 * Filters features which could be the nearest to someone freely moving in the provided circle.
 *
 * In mathematical terms, narrows candidates, such that:
 * { candidate ∈ candidates | ∃ point ∈ circle : nearestPoint(point, candidates) = candidate }
 *
 * In visual terms, returns candidates, whose [Voronoi cells](https://en.wikipedia.org/wiki/Voronoi_diagram)
 * intersect the provided circle, but without actually computing the Voronoi diagram.
 */
export function nearestPointsToCircle<P extends GeoJsonProperties>(
    candidates: FeatureCollection<Point, P>,
    root: Position,
    radius: number,
): FeatureCollection<Point, P> {
    // With at most 1 candidate, there's nothing to compute
    if (candidates.features.length <= 1) return candidates;

    // Compute distances between candidates and the root
    const distances = candidates.features.map((c) => turf.distance(root, c));
    const [closestIdx, minDistance] = argmin(distances);

    // Create a cache for distanceToBoundary calculations
    const distanceToBoundaryCache = new Map<string, number>();
    const distanceToBoundaryCached = (aIdx: number, bIdx: number): number => {
        if (aIdx === bIdx) return 0;

        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        const key = aIdx <= bIdx ? `${aIdx}:${bIdx}` : `${bIdx}:${aIdx}`;
        const cached = distanceToBoundaryCache.get(key);
        if (cached !== undefined) return cached;

        const distAB = turf.distance(candidates.features[aIdx], candidates.features[bIdx]);
        const dist = distanceToBoundary(distances[aIdx], distances[bIdx], distAB);
        distanceToBoundaryCache.set(key, dist);
        return dist;
    };

    // Perform O(n) tests to quickly filter the candidate pool
    const initial = candidates.features.reduce((pool, _, idx): number[] => {
        // Candidate closest to the root by definition passes the test
        if (idx === closestIdx) {
            pool.push(idx);
            return pool;
        }

        // TEST 1: If candidate is further from the closest point by more than double the radius,
        // it can't be in the result set.
        const candidateDistance = distances[idx];
        if (candidateDistance - minDistance > 2 * radius) return pool;

        // TEST 2: If boundary separating candidate and the closest point falls outside of the
        // circle, the candidate can't be in the result set.
        if (distanceToBoundaryCached(closestIdx, idx) <= radius) pool.push(idx);
        return pool;
    }, []);

    // Perform more expensive O(n²) tests on the pruned candidate pool
    const final = initial.filter((i) => {
        // TEST 3: If candidate is shadowed by any other candidate, it can't be in the result set
        return !initial.some((j) => {
            if (i === j) return false; // can't be shadowed by oneself

            // If i is closer to the root than j, it can't be shadowed by j
            if (distances[i] < distances[j]) return false;

            // If the boundary between i and j falls outside of the circle,
            // j shadows i (thanks to the previous condition as well), and
            // i can't be in the result set
            return distanceToBoundaryCached(i, j) > radius;
        });
    });

    return turf.featureCollection(final.map((idx) => candidates.features[idx]));
}

/**
 * Computes the distance from X to the boundary separating A and B, based solely
 * on distances in the ABX triangle
 */
function distanceToBoundary(distAX: number, distBX: number, distAB: number): number {
    if (distAB < 1e-9) return 0;

    const sinDelta =
        Math.abs(Math.cos(distAX / earthRadiusKm) - Math.cos(distBX / earthRadiusKm)) /
        (2 * Math.sin(distAB / (2 * earthRadiusKm)));
    return Math.asin(Math.min(1, sinDelta)) * earthRadiusKm;
}

/**
 * Finds the smallest number in the provided array, and returns its index (and the value).
 * Returns `[NaN, Infinity]` for empty arrays or arrays full of NaNs and Infinities.
 */
function argmin(values: number[]): [idx: number, min: number] {
    return values.reduce(
        ([minIdx, min], value, idx) => {
            return value < min ? [idx, value] : [minIdx, min];
        },
        [Number.NaN, Infinity],
    );
}
