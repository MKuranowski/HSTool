// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import { Delaunay } from "d3-delaunay";
import type {
    BBox,
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
    LineString,
    MultiPolygon,
    Point,
    Polygon,
    Position,
} from "geojson";

export const earthRadiusKm = turf.earthRadius / 1000;

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
 * Returns `true` if given point is in the provided Polygon or MultiPolygon.
 *
 * Workaround for turf not supporting booleanContains for MultiPolygons.
 */
export function areaContains(area: Polygon | MultiPolygon, pt: Point): boolean {
    switch (area.type) {
        case "Polygon":
            return turf.booleanContains(area, pt);

        case "MultiPolygon":
            // turf.booleanContains(MultiPolygon, Point) doesn't work, see https://github.com/Turfjs/turf/issues/2975
            return area.coordinates.some((polygonCoords) =>
                turf.booleanContains(turf.polygon(polygonCoords), pt),
            );
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

export function isArea<P extends GeoJsonProperties>(
    f: Feature<Geometry, P>,
): f is Feature<Polygon | MultiPolygon, P> {
    switch (f.geometry.type) {
        case "Polygon":
        case "MultiPolygon":
            return true;

        default:
            return false;
    }
}

export function isPolygon<P extends GeoJsonProperties>(
    f: Feature<Geometry, P>,
): f is Feature<Polygon, P> {
    return f.geometry.type === "Polygon";
}

export function isMultiPolygon<P extends GeoJsonProperties>(
    f: Feature<Geometry, P>,
): f is Feature<MultiPolygon, P> {
    return f.geometry.type === "MultiPolygon";
}

export function soleDivision<Answer extends string>(
    extent: BBox,
    answer: Answer,
): FeatureCollection<Polygon, { id: Answer; answer: Answer }> {
    const polygon = turf.bboxPolygon(extent, {
        properties: { id: answer, answer } as const,
    });
    return turf.featureCollection([polygon]);
}

export function voronoi<P extends { [key: string]: unknown }>(
    points: FeatureCollection<Point, P>,
    options?: { extent?: BBox; buffer?: number },
): FeatureCollection<Polygon | MultiPolygon, P> {
    // TODO: Use spherical Voronoi when points span more than a couple degrees of longitude
    return planarVoronoi(points, options);
}

export function planarVoronoi<P extends { [key: string]: unknown }>(
    points: FeatureCollection<Point, P>,
    options?: { extent?: BBox; buffer?: number },
): FeatureCollection<Polygon | MultiPolygon, P> {
    // Calculate the extent, and project to Mercator
    const extent = options?.extent ?? bufferBBox(turf.bbox(points), options?.buffer ?? 1);
    if (extent.length !== 4) throw new Error("planarVoronoi: BBox must have 4 elements");
    const extentMercator = [
        ...turf.toMercator(extent.slice(0, 2)),
        ...turf.toMercator(extent.slice(2, 4)),
    ];

    // Project points to mercator, and flatten them to a Float64Array
    // NOTE: d3 expects [x0 y0 ...], while GeoJSON encodes positions as [y x].
    const pointsMercatorCoords = new Float64Array(points.features.length * 2);
    turf.toMercator(points).features.forEach((p, idx) => {
        pointsMercatorCoords[2 * idx] = p.geometry.coordinates[1];
        pointsMercatorCoords[2 * idx + 1] = p.geometry.coordinates[0];
    });

    // Compute the voronoi diagram
    const delaunay = new Delaunay(pointsMercatorCoords);
    const voronoi = delaunay.voronoi([
        extentMercator[1],
        extentMercator[0],
        extentMercator[3],
        extentMercator[2],
    ]);

    // Extract voronoi polygons back to GeoJSON features
    const features = new Array<Feature<Polygon | MultiPolygon, P> | undefined>(
        points.features.length,
    );
    for (const cell of voronoi.cellPolygons()) {
        const polygon = [cell.map(([x, y]) => [y, x])];
        const point = points.features[cell.index];
        const current = features[cell.index];

        if (current !== undefined) {
            const union = turf.union(turf.featureCollection([current, turf.polygon(polygon)]), {
                properties: point.properties,
            });
            if (union === null) throw new Error("turf.union: null result");
            features[cell.index] = union;
        } else {
            features[cell.index] = turf.polygon(polygon, point.properties);
        }
    }

    // Project features back to WGS-84
    const collection = {
        type: "FeatureCollection" as const,
        features: features.filter((i) => i !== undefined),
    };
    turf.toWgs84(collection, { mutate: true });
    return collection;
}

export function bufferBBox(b: BBox, distance: number): BBox {
    if (b.length !== 4) throw new Error("bufferBBox: BBox must have 4 elements");
    const d = distance * Math.SQRT2;
    return [
        ...turf.transformTranslate(turf.point([b[0], b[1]]), d, 225).geometry.coordinates,
        ...turf.transformTranslate(turf.point([b[2], b[3]]), d, 45).geometry.coordinates,
    ] as [number, number, number, number];
}

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

    const [rootX, rootY, rootZ] = lonLatTo3D(root);
    const [closestX, closestY, closestZ] = lonLatTo3D(
        candidates.features[closestIdx].geometry.coordinates,
    );

    // Filter candidates if they can be the nearest to at least one point in the circle
    return turf.featureCollection(
        candidates.features.filter((candidate, idx) => {
            // Closest point to the root can be closest by definition
            if (idx === closestIdx) return true;

            // If candidate is further than double the radius, it can't be the closest
            const candidateDistance = distances[idx];
            if (candidateDistance - minDistance > 2 * radius) return false;

            // OLDER, 3D, VECTOR BASED MATH
            const [candidateX, candidateY, candidateZ] = lonLatTo3D(candidate.geometry.coordinates);

            // Find the vector separating the closest point and this candidate
            const separationX = closestX - candidateX;
            const separationY = closestY - candidateY;
            const separationZ = closestZ - candidateZ;
            const separationMag = Math.sqrt(separationX ** 2 + separationY ** 2 + separationZ ** 2);

            // Handle candidates very close to the closest point
            if (separationMag < 1e-8) return true;

            // Compute the dot product between circle root and separation vector
            const dot = rootX * separationX + rootY * separationY + rootZ * separationZ;

            // Compute the distance between the great circle boundary separating candidate with the closest point
            const distToSeparation = turf.radiansToLength(Math.asin(Math.abs(dot) / separationMag));
            return distToSeparation <= radius;
        }),
    );
}

export function lonLatTo3D(pos: Position): [x: number, y: number, z: number] {
    if (pos.length < 2) throw new Error(`invalid WGS-84 position: ${pos.toString()}`);
    const lonRad = (pos[0] * Math.PI) / 180;
    const latRad = (pos[1] * Math.PI) / 180;
    return [
        Math.cos(latRad) * Math.cos(lonRad),
        Math.cos(latRad) * Math.sin(lonRad),
        Math.sin(latRad),
    ];
}

function argmin(values: number[]): [idx: number, min: number] {
    return values.reduce(
        ([minIdx, min], value, idx) => {
            return value < min ? [idx, value] : [minIdx, min];
        },
        [-1, Infinity],
    );
}
