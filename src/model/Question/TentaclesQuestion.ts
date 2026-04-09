// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import * as turf from "@turf/turf";
import type { FeatureCollection, Point, Position } from "geojson";
import * as z from "zod";
import { withPossibleAnswers } from "../../helper/geo";
import * as Geo from "../Geo";

export type T = z.infer<typeof schema>;
export const NIL = "(Nil Answer)";

export const schema = z.object({
    kind: z.literal("tentacles"),
    name: z.string(),
    candidates: Geo.featureCollection(Geo.point, Geo.withID),
    seeker: Geo.position,
    radius: z.number().nonnegative(),
    answer: z.string().optional(),
});

export function name(q: T): string {
    return `Tentacles: ${q.name}`;
}

export function empty(seeker: Position): T {
    return {
        kind: "tentacles",
        name: "empty",
        candidates: { type: "FeatureCollection", features: [] },
        seeker,
        radius: 2,
    };
}

export function answers(q: T): string[] {
    return [NIL, ...viableCandidates(q).features.map((c) => c.properties.name ?? c.properties.id)];
}

function viableCandidates(q: T): T["candidates"] {
    return turf.featureCollection(
        q.candidates.features.filter((c) => turf.distance(c, q.seeker) < q.radius),
    );
}

export function categorize<P extends { [name: string]: unknown }>(
    q: T,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: string[] }> {
    const candidates = viableCandidates(q).features;
    // Shortcut - without any candidates only the nil answer is possible
    if (candidates.length === 0) return withPossibleAnswers(stations, () => [NIL]);

    return withPossibleAnswers(stations, (s) => {
        // Check if miss is the only option
        const distanceToRoot = turf.distance(s, q.seeker);
        if (distanceToRoot > q.radius + tolerance) return [NIL];

        // Check if miss is possible
        const matches: string[] = [];
        if (distanceToRoot >= q.radius - tolerance) matches.push(NIL);

        // Check which candidates could be returned
        const distances = candidates.map((c) => turf.distance(s, c));
        const closest = Math.min(...distances);
        matches.push(
            ...candidates
                .map((c) => c.properties.name ?? c.properties.id)
                .filter((_, i) => distances[i] <= closest + tolerance),
        );

        return matches;
    });
}
