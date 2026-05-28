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
import { hashCoords } from "../../helper/geo/prop";
import * as Geo from "../Geo";
import * as base from "./base";

export interface _Cache {
    seekerArea: Feature<Polygon | MultiPolygon, Geo.PropertiesWithID>;
    stationCategories: Map<string, A[]>;
}

export type T = z.infer<typeof schema> & { _cache?: _Cache | undefined };
export type A = Exclude<T["answer"], undefined>;

export const schema = base.schema.extend({
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
    if (q._cache?.seekerArea) return q._cache.seekerArea;

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

    q._cache = { seekerArea: candidates[0], stationCategories: new Map() };
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

    const categorize = binaryCategorizer(
        (s) => distanceToFeature(s.geometry.coordinates, match),
        tolerance,
        "hit",
        "miss",
    );

    return withPossibleAnswers(stations, (s) => {
        const key = hashCoords(s.geometry.coordinates);
        let ans = q._cache?.stationCategories.get(key);
        if (ans !== undefined) return ans;

        ans = categorize(s);
        if (q._cache) q._cache.stationCategories.set(key, ans);
        return ans;
    });
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
    return { ...q, _cache: undefined, seeker: mergePositions(q.seeker, newPosition) };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function withDistance(q: T, _distance: number): T {
    return q;
}
