// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { FeatureCollection, Point, Position } from "geojson";
import * as z from "zod";
import { binaryCategorizer, distanceToFeature, withPossibleAnswers } from "../../helper/geo";
import * as Geo from "../Geo";

export type T = z.infer<typeof schema>;
export type A = Exclude<T["answer"], undefined>;

export const schema = z.object({
    kind: z.literal("match-area"),
    area: Geo.feature(z.discriminatedUnion("type", [Geo.polygon, Geo.multiPolygon]), Geo.withID),
    answer: z.literal(["hit", "miss"]).optional(),
});

export function name(q: T): string {
    return `Match: ${q.area.properties.name ?? q.area.properties.id}`;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function empty(_seeker: Position): T {
    return {
        kind: "match-area",
        area: {
            type: "Feature",
            geometry: {
                type: "Polygon",
                coordinates: [
                    [
                        [0, 0],
                        [0, 0],
                        [0, 0],
                        [0, 0],
                    ],
                ],
            },
            properties: {
                id: "empty",
            },
        },
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
    return withPossibleAnswers(
        stations,
        binaryCategorizer(
            (s) => distanceToFeature(s.geometry.coordinates, q.area),
            tolerance,
            "hit",
            "miss",
        ),
    );
}
