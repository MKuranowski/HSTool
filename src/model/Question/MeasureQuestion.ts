// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { FeatureCollection, Point, Position } from "geojson";
import * as z from "zod";
import {
    binaryCategorizer,
    distanceToFeature,
    mergePositions,
    withPossibleAnswers,
} from "../../helper/geo";
import * as Geo from "../Geo";

export type T = z.infer<typeof schema>;
export type A = Exclude<T["answer"], undefined>;

export const schema = z.object({
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

export function categorize<P extends { [name: string]: unknown }>(
    q: T,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: A[] }> {
    const seekerDistance = Math.min(
        ...q.candidates.features.map((f) => distanceToFeature(q.seeker, f)),
    );
    return withPossibleAnswers(
        stations,
        binaryCategorizer(
            (s) => {
                const stationDistance = Math.min(
                    ...q.candidates.features.map((f) =>
                        distanceToFeature(s.geometry.coordinates, f),
                    ),
                );
                return stationDistance - seekerDistance;
            },
            tolerance,
            "closer",
            "further",
        ),
    );
}

export function withPosition(q: T, newPosition: (number | null)[]): T {
    return { ...q, seeker: mergePositions(q.seeker, newPosition) };
}
