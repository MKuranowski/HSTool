// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type {
    BBox,
    Feature,
    FeatureCollection,
    GeoJsonProperties,
    Geometry,
    MultiPolygon,
    Polygon,
} from "geojson";

/**
 * Checks if the provided feature has a Polygon or a MultiPolygon geometry.
 */
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

/**
 * Checks if the provided feature has a Polygon geometry.
 */
export function isPolygon<P extends GeoJsonProperties>(
    f: Feature<Geometry, P>,
): f is Feature<Polygon, P> {
    return f.geometry.type === "Polygon";
}

/**
 * Checks if the provided feature has a MultiPolygon geometry.
 */
export function isMultiPolygon<P extends GeoJsonProperties>(
    f: Feature<Geometry, P>,
): f is Feature<MultiPolygon, P> {
    return f.geometry.type === "MultiPolygon";
}

/**
 * Expands the provided bounding box by `distance` in each direction.
 */
export function bufferBBox(b: BBox, distance: number): BBox {
    const dim = b.length >> 1; // integer division by 2
    const d = distance * Math.SQRT2; // move the corners along the hypotenuse

    const min = turf.point(b.slice(0, dim));
    turf.transformTranslate(min, d, 225, { mutate: true });

    const max = turf.point(b.slice(dim));
    turf.transformTranslate(max, d, 45, { mutate: true });

    return [...min.geometry.coordinates, ...max.geometry.coordinates] as BBox;
}

/**
 * Creates a FeatureCollection with a single Polygon ("division") covering the
 * entire provided bbox; annotated with the provided answer.
 */
export function soleDivision<Answer extends string>(
    extent: BBox,
    answer: Answer,
): FeatureCollection<Polygon, { id: Answer; answer: Answer }> {
    const polygon = turf.bboxPolygon(extent, {
        properties: { id: answer, answer },
    });
    return turf.featureCollection([polygon]);
}
