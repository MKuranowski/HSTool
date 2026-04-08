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
