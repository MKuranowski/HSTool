// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { FeatureCollection, Point, Position } from "geojson";
import * as z from "zod";
import { binaryCategorizer, mergePositions, withPossibleAnswers } from "../../helper/geo";
import * as Geo from "../Geo";

export type T = z.infer<typeof schema>;
export type A = Exclude<T["answer"], undefined>;

export const schema = z.object({
    kind: z.literal("thermometer"),
    seeker: Geo.position,
    azimuth: z.number().min(0).max(360),
    distance: z.number().nonnegative(),
    answer: z.literal(["colder", "hotter"]).optional(),
});

export function getEndLocation(q: T): Position {
    return turf.transformTranslate(turf.point(q.seeker), q.distance, q.azimuth).geometry
        .coordinates;
}

export function name(q: T): string {
    return `Thermometer: ${q.distance.toFixed(1)} km`;
}

export function empty(seeker: Position): T {
    return {
        kind: "thermometer",
        seeker: seeker,
        azimuth: 90,
        distance: 1,
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function answers(_q: T): A[] {
    return ["colder", "hotter"];
}

export function categorize<P extends { [name: string]: unknown }>(
    q: T,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: A[] }> {
    const end = getEndLocation(q);
    return withPossibleAnswers(
        stations,
        binaryCategorizer(
            (s) => turf.distance(s, q.seeker) - turf.distance(s, end),
            tolerance,
            "colder",
            "hotter",
        ),
    );
}

export function withPosition(q: T, newPosition: (number | null)[]): T {
    return { ...q, seeker: mergePositions(q.seeker, newPosition) };
}
