// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { BBox, Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import type { Area } from "../../model/geo.ts";
import type { Answer, Answered } from "../../model/props.ts";

/**
 * Returns true if the feature has Polygon or MultiPolygon geometry.
 */
export function isArea(f: Feature): f is Feature<Area> {
    switch (f.geometry.type) {
        case "Polygon":
        case "MultiPolygon":
            return true;

        default:
            return false;
    }
}

export function isMultiPolygon(f: Feature): f is Feature<MultiPolygon> {
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
export function soleDivision(extent: BBox, answer: Answer): FeatureCollection<Polygon, Answered> {
    const polygon = turf.bboxPolygon(extent, {
        properties: {
            id: answer.id,
            answer,
        },
    });
    return turf.featureCollection([polygon]);
}
