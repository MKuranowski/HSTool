// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Feature, FeatureCollection, Geometry } from "geojson";
import type { Answer, Answered, Identified, WithPossibleAnswers } from "../model/props.ts";
import { withPropertiesInCollection } from "./geo/prop.ts";

/**
 * Creates a new FeatureCollection with each feature's "possibleAnswers" property set to
 * the result of calling `categorize` on that feature.
 */
export function withPossibleAnswers<G extends Geometry, P extends object>(
    collection: FeatureCollection<G, P>,
    categorize: (f: Feature<G, P>) => Answer[],
): FeatureCollection<G, P & WithPossibleAnswers> {
    return withPropertiesInCollection(collection, (f) => ({ possibleAnswers: categorize(f) }));
}

/**
 * Creates a new FeatureCollection with each feature's "answer" property set to
 * the result of calling `categorize` on that feature.
 */
export function withAnswers<G extends Geometry, P extends Identified>(
    collection: FeatureCollection<G, P>,
    categorize: (f: Feature<G, P>) => Answer,
): FeatureCollection<G, P & Answered> {
    return withPropertiesInCollection(collection, (f) => ({ answer: categorize(f) }));
}

/**
 * Makes a binary categorization based on the sign of `dist`.
 *
 * If `dist` returns a negative number, `[negative]` is returned; otherwise `[positive]` is returned.
 * However if `Math.abs(dist) <= tolerance`, both answers are returned.
 */
export function categorizeBinary<A extends Answer>(
    dist: number,
    tolerance: number,
    negative: A,
    positive: A,
): A[] {
    if (Math.abs(dist) <= tolerance) return [negative, positive];
    return [dist < 0 ? negative : positive];
}

/**
 * Returns `true` if any of the `possible` answers contains an answer with the provided `id`.
 */
export function hasAnswer(possible: Iterable<Answer>, id: string): boolean {
    for (const p of possible) {
        if (p.id === id) return true;
    }
    return false;
}
