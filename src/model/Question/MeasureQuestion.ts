// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { BBox, FeatureCollection, MultiPolygon, Point, Polygon, Position } from "geojson";
import * as z from "zod";
import {
    binaryCategorizer,
    distanceToFeature,
    isArea,
    isMultiPolygon,
    mergePositions,
    soleDivision,
    withPossibleAnswers,
} from "../../helper/geo";
import * as Geo from "../Geo";
import * as base from "./base";

export type T = z.infer<typeof schema>;
export type A = Exclude<T["answer"], undefined>;

export const schema = base.schema.extend({
    kind: z.literal("measure"),
    name: z.string(),
    candidates: Geo.featureCollection(
        z.discriminatedUnion("type", [Geo.point, Geo.lineString]),
        Geo.withID,
    ),
    seeker: Geo.position,
    answer: z.literal(["closer", "further"]).optional(),
});

export function name(q: T): string {
    return `Measure: ${q.name}`;
}

export function empty(seeker: Position): T {
    return {
        kind: "measure",
        name: "empty",
        candidates: { type: "FeatureCollection", features: [] },
        seeker,
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function answers(_q: T): A[] {
    return ["closer", "further"];
}

export function calcDistance(q: T, root?: Position): number {
    root ??= q.seeker;
    return Math.min(...q.candidates.features.map((f) => distanceToFeature(root, f)));
}

export function categorize<P extends { [name: string]: unknown }>(
    q: T,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: A[] }> {
    const seekerDistance = calcDistance(q);
    return withPossibleAnswers(
        stations,
        binaryCategorizer(
            (s) => {
                const stationDistance = calcDistance(q, s.geometry.coordinates);
                return stationDistance - seekerDistance;
            },
            tolerance,
            "closer",
            "further",
        ),
    );
}

export function divideArea(
    q: T,
    extent: BBox,
): FeatureCollection<Polygon | MultiPolygon, Geo.PropertiesWithID & { answer: A }> {
    const distance = calcDistance(q);
    const buffers = turf.buffer(q.candidates, distance);
    if (buffers === undefined || buffers.features.length === 0)
        return soleDivision(extent, "further");

    const buffer = buffers.features.length > 1 ? turf.union(buffers) : buffers.features[0];
    if (buffer === null) return soleDivision(extent, "further");

    const closer = turf.bboxClip(buffer, extent);
    if (!isArea(closer)) return soleDivision(extent, "further");

    /// HOTFIX: turf.bboxClip can simply return a `[]` polygon, which breaks turf.difference
    if (isMultiPolygon(closer)) {
        closer.geometry.coordinates = closer.geometry.coordinates.filter(
            (polygon) => polygon.length > 0,
        );
    }

    const extentPolygon = turf.bboxPolygon(extent);
    const further = turf.difference(
        turf.featureCollection<Polygon | MultiPolygon>([extentPolygon, closer]),
    );
    if (further === null) return soleDivision(extent, "closer");

    return turf.featureCollection([
        { ...closer, properties: { id: "closer", answer: "closer" } },
        { ...further, properties: { id: "further", answer: "further" } },
    ]);
}

export function withPosition(q: T, newPosition: (number | null)[]): T {
    return { ...q, seeker: mergePositions(q.seeker, newPosition) };
}
