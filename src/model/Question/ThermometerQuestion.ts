// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { FeatureCollection, Point, Position } from "geojson";
import * as z from "zod";
import { binaryCategorizer, withPossibleAnswers } from "../../helper/geo";
import * as Geo from "../Geo";

export type T = z.infer<typeof schema>;
export type A = Exclude<T["answer"], undefined>;

export const schema = z.object({
    kind: z.literal("thermometer"),
    start: Geo.position,
    end: Geo.position,
    answer: z.literal(["hotter", "colder"]).optional(),
});

export function name(q: T): string {
    const d = turf.distance(q.start, q.end);
    return `Thermometer: ${d.toFixed(1)} km`;
}

export function empty(seeker: Position): T {
    const end = turf.transformTranslate(turf.point(seeker), 1, 90).geometry.coordinates;
    return {
        kind: "thermometer",
        start: seeker,
        end,
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function answers(_q: T): A[] {
    return ["hotter", "colder"];
}

export function categorize<P extends { [name: string]: unknown }>(
    q: T,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: A[] }> {
    return withPossibleAnswers(
        stations,
        binaryCategorizer(
            (s) => turf.distance(s, q.end) - turf.distance(s, q.start),
            tolerance,
            "hotter",
            "colder",
        ),
    );
}
