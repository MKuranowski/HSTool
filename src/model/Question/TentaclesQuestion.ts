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
import { type PossibleAnswer, withPossibleAnswers } from "../../helper/answer";
import {
    isArea,
    mergePositions,
    nearestPointsToCircle,
    soleDivision,
    voronoi,
} from "../../helper/geo";
import * as Geo from "../Geo";
import * as base from "./base";

export interface _Cache {
    viableCandidates: T["candidates"];
}

export type T = z.infer<typeof schema> & { _cache?: _Cache | undefined };
export const NIL = "(Nil answer)";

export const schema = base.schema.extend({
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
    return [NIL, ...viableCandidates(q).features.map((c) => c.properties.id)];
}

function viableCandidates(q: T): T["candidates"] {
    if (!q._cache) {
        q._cache = {
            viableCandidates: turf.featureCollection(
                q.candidates.features.filter((c) => turf.distance(c, q.seeker) < q.radius),
            ),
        };
    }
    return q._cache.viableCandidates;
}

export function categorize<P extends { [name: string]: unknown }>(
    q: T,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: PossibleAnswer[] }> {
    const candidates = viableCandidates(q);
    // Shortcut - without any candidates only the nil answer is possible
    if (candidates.features.length === 0) return withPossibleAnswers(stations, () => [NIL]);

    return withPossibleAnswers(stations, (s) => {
        // Check if miss is the only option
        const distanceToRoot = turf.distance(s, q.seeker);
        if (distanceToRoot > q.radius + tolerance) return [NIL];

        // Check which candidates could be returned
        const matches: PossibleAnswer[] = nearestPointsToCircle(
            candidates,
            s.geometry.coordinates,
            tolerance,
        ).features.map((c) =>
            c.properties.name ? [c.properties.id, c.properties.name] : c.properties.id,
        );

        // Check if miss is possible
        if (distanceToRoot >= q.radius - tolerance) matches.unshift(NIL);

        return matches;
    });
}

export function divideArea(
    q: T,
    extent: BBox,
): FeatureCollection<Polygon | MultiPolygon, Geo.PropertiesWithAnswer> {
    // Figure out the candidates for tentacles - if there are none, the only possible answer is nil
    const candidates = viableCandidates(q);
    if (candidates.features.length === 0) return soleDivision(extent, NIL);

    // Calculate the area where tentacles are effective
    const effectiveCircle = turf.bboxClip(turf.circle(q.seeker, q.radius), extent);
    if (!isArea(effectiveCircle)) return soleDivision(extent, NIL);

    // Find if a nil answer is possible, and add it as a possible division
    const divisions: Feature<Polygon | MultiPolygon, Geo.PropertiesWithAnswer>[] = [];
    const nilArea = turf.difference(
        turf.featureCollection<Polygon | MultiPolygon>([turf.bboxPolygon(extent), effectiveCircle]),
    );
    if (nilArea !== null) {
        divisions.push({ ...nilArea, properties: { id: NIL, answer: NIL } });
    }

    // Add divisions by voronoi-ing the candidates in the effective circle
    for (const area of voronoi(candidates, { extent: turf.bbox(effectiveCircle) }).features) {
        const effectiveArea = turf.intersect(turf.featureCollection([area, effectiveCircle]), {
            properties: { ...area.properties, answer: area.properties.id },
        });
        if (effectiveArea !== null) divisions.push(effectiveArea);
    }

    return turf.featureCollection(divisions);
}

export function withPosition(q: T, newPosition: (number | null)[]): T {
    return { ...q, _cache: undefined, seeker: mergePositions(q.seeker, newPosition) };
}

export function withDistance(q: T, distance: number): T {
    return { ...q, _cache: undefined, radius: distance };
}
