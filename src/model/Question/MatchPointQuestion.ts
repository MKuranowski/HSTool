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
    kind: z.literal("match-point"),
    name: z.string(),
    candidates: Geo.featureCollection(Geo.point, Geo.withID),
    seeker: Geo.position,
    answer: z.literal(["hit", "miss"]).optional(),
});

export function name(q: T): string {
    if (q.candidates.features.length > 0) {
        const match = turf.nearestPoint(q.seeker, q.candidates);
        const matchName = match.properties.name ?? match.properties.id;
        return `Match: ${q.name} (${matchName})`;
    }
    return `Match: ${q.name}`;
}

export function empty(seeker: Position): T {
    return {
        kind: "match-point",
        name: "empty",
        candidates: { type: "FeatureCollection", features: [] },
        seeker,
    };
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
    if (q.candidates.features.length === 0) {
        return withPossibleAnswers(stations, () => ["miss"]);
    }

    const nearest = turf.nearestPoint(q.seeker, q.candidates);
    return withPossibleAnswers(
        stations,
        binaryCategorizer(
            (s) => {
                const distances = q.candidates.features.map((c) => turf.distance(s, c));
                const [distanceToMatched] = distances.splice(nearest.properties.featureIndex, 1);
                const distanceToOther = Math.min(...distances);
                return distanceToMatched - distanceToOther;
            },
            tolerance,
            "hit",
            "miss",
        ),
    );
}

export function withPosition(q: T, newPosition: (number | null)[]): T {
    return { ...q, seeker: mergePositions(q.seeker, newPosition) };
}
