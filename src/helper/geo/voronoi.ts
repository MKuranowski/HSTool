// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import { Delaunay } from "d3-delaunay";
import type {
    BBox,
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    MultiPolygon,
    Point,
    Polygon,
} from "geojson";
import { bufferBBox } from "./area";

const defaultExtent: BBox = [-180, -90, 180, 90];

/**
 * Computes the Voronoi diagram of the provided points. Currently simply forwards the call to
 * {@link planarVoronoi}, as a proper spherical Voronoi is yet to be implemented.
 *
 * Options only apply to {@link planarVoronoi}, which requires knowing the boundary rectangle.
 * If `extent` is set, it is used explicitly; else if `buffer` is set, {@link bufferBBox} is
 * used to "pad" the bounding box of `points` by the given distance; falling back to a
 * bounding box of covering the entire Earth, which will result **in massive distortion**.
 */
export function voronoi<P extends GeoJsonProperties>(
    points: FeatureCollection<Point, P>,
    options?: { extent?: BBox; buffer?: number },
): FeatureCollection<Polygon | MultiPolygon, P> {
    // TODO: Use spherical Voronoi when points span more than a couple degrees of longitude
    return planarVoronoi(points, options);
}

/**
 * Computes the Voronoi diagram of the provided points by projecting the points to Mercator,
 * computing the Voronoi diagram as if on an Euclidean rectangle, and projecting the Polygons
 * back to WGS-84.
 *
 * This means the result is technically not mathematically sound. However, when the dataset
 * only spans a couple of degrees in longitude, that distortion is generally acceptable.
 *
 * This method requires knowing a bounding rectangle around the features. `options.extent`
 * can be provided directly, or this function can pre-compute the rectangle by padding
 * the bbox of points by `options.buffer` kilometers in each direction. Not providing
 * any of those options is ill-advised, as the fallback extent is the entire Earth, which
 * leads to massive distortion.
 *
 * This method is also more reliable than computing a proper Voronoi diagram on a sphere,
 * especially when distances between points are on the scale of meters, among other things. See:
 * - https://github.com/Fil/d3-geo-voronoi/issues/10
 * - https://github.com/Fil/d3-geo-voronoi/issues/22
 */
export function planarVoronoi<P extends GeoJsonProperties>(
    points: FeatureCollection<Point, P>,
    options?: { extent?: BBox; buffer?: number },
): FeatureCollection<Polygon | MultiPolygon, P> {
    // Calculate the extent, and project to Mercator
    const extent = resolveExtent(points, options);
    const extentMaxOffset = extent.length >> 1; // integer division by 2
    const extentMercator = [
        ...turf.toMercator(extent.slice(0, 2)),
        ...turf.toMercator(extent.slice(extentMaxOffset, extentMaxOffset + 2)),
    ];
    if (extentMercator.length !== 4)
        throw new Error(
            "turf.toMercator returned unexpected number of dimensions: " +
                `got ${(extentMercator.length / 2).toString()}, expected 2`,
        );

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
            const union = turf.union(
                turf.featureCollection([current, turf.polygon(polygon, null)]),
                {
                    properties: point.properties,
                },
            );
            if (union === null)
                throw new Error(
                    `turf.union(${current.geometry.type}, Polygon): got null, expected Polygon or MultiPolygon`,
                );

            features[cell.index] = union;
        } else {
            features[cell.index] = turf.polygon(polygon, point.properties);
        }
    }

    // Project features back to WGS-84
    const collection = turf.featureCollection(features.filter((i) => i !== undefined));
    turf.toWgs84(collection, { mutate: true });
    return collection;
}

function resolveExtent(
    points: FeatureCollection<Point>,
    options?: { extent?: BBox; buffer?: number },
): BBox {
    if (options?.extent !== undefined) {
        return options.extent;
    } else if (options?.buffer !== undefined && points.features.length >= 2) {
        return bufferBBox(turf.bbox(points), options.buffer);
    }
    return defaultExtent;
}
