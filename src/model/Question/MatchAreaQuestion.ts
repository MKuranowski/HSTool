// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type {
    BBox,
    Feature,
    FeatureCollection,
    MultiPolygon,
    Point,
    Polygon,
    Position,
} from "geojson";
import * as z from "zod";
import {
    binaryCategorizer,
    distanceToFeature,
    mergePositions,
    withPossibleAnswers,
    withPropertiesInCollection,
} from "../../helper/geo";
import * as Geo from "../Geo";

export type T = z.infer<typeof schema>;
export type A = Exclude<T["answer"], undefined>;

export const schema = z.object({
    kind: z.literal("match-area"),
    name: z.string(),
    candidates: Geo.featureCollection(Geo.anyPolygon, Geo.withID),
    seeker: Geo.position,
    answer: z.literal(["hit", "miss"]).optional(),
});

export function name(q: T): string {
    const match = seekerArea(q);
    if (match) {
        const matchName = match.properties.name ?? match.properties.id;
        return `Match: ${q.name} (${matchName})`;
    }
    return `Match: ${q.name}`;
}

export function empty(seeker: Position): T {
    return {
        kind: "match-area",
        name: "empty",
        candidates: { type: "FeatureCollection", features: [] },
        seeker,
    };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function answers(_q: T): A[] {
    return ["hit", "miss"];
}

export function seekerArea(
    q: T,
): Feature<Polygon | MultiPolygon, Geo.PropertiesWithID> | undefined {
    const seeker = { type: "Point", coordinates: q.seeker } as const;
    const candidates = q.candidates.features.filter((area) => {
        return turf.booleanPointInPolygon(seeker, area);
    });

    if (candidates.length === 0) {
        console.warn(`Match ${q.name} - seekers are not in any area from the preset`);
    } else if (candidates.length > 1) {
        console.warn(
            `Match ${q.name} - multiple candidate -`,
            candidates.map((c) => c.properties.name ?? c.properties.id),
        );
    }
    return candidates[0];
}

export function categorize<P extends { [name: string]: unknown }>(
    q: T,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: A[] }> {
    const match = seekerArea(q);

    // FIXME: If the seekers are outside of any area, we should return "hit" as a possible
    // answer if any point in the hiding zone around a station falls outside of any area.
    if (match === undefined) {
        return withPossibleAnswers(stations, () => ["miss"]);
    }

    return withPossibleAnswers(
        stations,
        binaryCategorizer(
            (s) => distanceToFeature(s.geometry.coordinates, match),
            tolerance,
            "hit",
            "miss",
        ),
    );
}

export function divideArea(
    q: T,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _extent: BBox,
): FeatureCollection<Polygon | MultiPolygon, Geo.PropertiesWithID & { answer: A }> {
    const match = seekerArea(q);
    return withPropertiesInCollection(q.candidates, (area) => ({
        answer: area.properties.id === match?.properties.id ? ("hit" as const) : ("miss" as const),
    }));
}

export function withPosition(q: T, newPosition: (number | null)[]): T {
    return { ...q, seeker: mergePositions(q.seeker, newPosition) };
}
