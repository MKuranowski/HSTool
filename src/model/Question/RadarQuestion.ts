// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { BBox, FeatureCollection, MultiPolygon, Point, Polygon, Position } from "geojson";
import * as z from "zod";
import {
    binaryCategorizer,
    isArea,
    mergePositions,
    soleDivision,
    withPossibleAnswers,
} from "../../helper/geo";
import * as Geo from "../Geo";

export type T = z.infer<typeof schema>;
export type A = Exclude<T["answer"], undefined>;

export const schema = z.object({
    kind: z.literal("radar"),
    seeker: Geo.position,
    radius: z.number().nonnegative(),
    answer: z.literal(["hit", "miss"]).optional(),
});

export function name(q: T): string {
    return `Radar: ${q.radius.toFixed(1)} km`;
}

export function empty(seeker: Position): T {
    return { kind: "radar", seeker, radius: 5 };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function answers(_q: T): A[] {
    return ["hit", "miss"];
}

export function categorize<P extends { [name: string]: unknown }>(
    q: T,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: A[] }> {
    return withPossibleAnswers(
        stations,
        binaryCategorizer((s) => turf.distance(s, q.seeker) - q.radius, tolerance, "hit", "miss"),
    );
}

export function divideArea(
    q: T,
    extent: BBox,
): FeatureCollection<Polygon | MultiPolygon, Geo.PropertiesWithID & { answer: A }> {
    const hit = turf.bboxClip(turf.circle(q.seeker, q.radius), extent);
    if (!isArea(hit)) return soleDivision(extent, "miss");

    const miss = turf.difference(
        turf.featureCollection<Polygon | MultiPolygon>([turf.bboxPolygon(extent), hit]),
    );
    if (miss === null) return soleDivision(extent, "hit");

    return turf.featureCollection([
        { ...hit, properties: { id: "hit", answer: "hit" } },
        { ...miss, properties: { id: "miss", answer: "miss" } },
    ]);
}

export function withPosition(q: T, newPosition: (number | null)[]): T {
    return { ...q, seeker: mergePositions(q.seeker, newPosition) };
}
