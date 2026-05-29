// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { BBox, FeatureCollection, MultiPolygon, Point, Polygon, Position } from "geojson";
import * as z from "zod";
import { binaryCategorizer, withPossibleAnswers } from "../../helper/answer";
import {
    distanceToFeature,
    isArea,
    isMultiPolygon,
    mergePositions,
    soleDivision,
} from "../../helper/geo";
import { hashCoords } from "../../helper/geo/prop";
import * as Geo from "../Geo";
import * as base from "./base";

export interface _Cache {
    seekerDistance: number;
    stationCategories: Map<string, A[]>;
    division?:
        | FeatureCollection<Polygon | MultiPolygon, Geo.PropertiesWithID & { answer: A }>
        | undefined;
}

export type T = z.infer<typeof schema> & { _cache?: _Cache | undefined };
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

export function calcSeekerDistance(q: T): number {
    if (q._cache) return q._cache.seekerDistance;

    const d = calcDistance(q);
    q._cache = { seekerDistance: d, stationCategories: new Map() };
    return d;
}

export function categorize<P extends { [name: string]: unknown }>(
    q: T,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: A[] }> {
    const seekerDistance = calcSeekerDistance(q);

    const categorize = binaryCategorizer(
        (s) => {
            const stationDistance = calcDistance(q, s.geometry.coordinates);
            return stationDistance - seekerDistance;
        },
        tolerance,
        "closer",
        "further",
    );

    return withPossibleAnswers(stations, (s) => {
        const key = `${hashCoords(s.geometry.coordinates)};${tolerance.toString()}`;
        let ans = q._cache?.stationCategories.get(key);
        if (ans !== undefined) return ans;

        ans = categorize(s);
        if (q._cache) q._cache.stationCategories.set(key, ans);
        return ans;
    });
}

function divideAreaInner(
    q: T,
    extent: BBox,
): FeatureCollection<Polygon | MultiPolygon, Geo.PropertiesWithID & { answer: A }> {
    const distance = calcSeekerDistance(q);
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

export function divideArea(
    q: T,
    extent: BBox,
): FeatureCollection<Polygon | MultiPolygon, Geo.PropertiesWithID & { answer: A }> {
    if (q._cache?.division !== undefined) return q._cache.division;

    const division = divideAreaInner(q, extent);
    if (q._cache === undefined)
        throw new Error("Expected MeasureQuestion.divideAreaInner to set _cache, but it did not");
    q._cache.division = division;
    return division;
}

export function withPosition(q: T, newPosition: (number | null)[]): T {
    return { ...q, _cache: undefined, seeker: mergePositions(q.seeker, newPosition) };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function withDistance(q: T, _distance: number): T {
    return q;
}
