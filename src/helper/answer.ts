// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { Feature, FeatureCollection, Point } from "geojson";
import { withPropertiesInCollection } from "./geo";

export type PossibleAnswer = string | [id: string, name: string];

/**
 * Creates a new FeatureCollection with each feature's "possibleAnswers" property set to
 * the result of calling `categorize` on that feature.
 */
export function withPossibleAnswers<Props extends object, Answer extends PossibleAnswer>(
    collection: FeatureCollection<Point, Props>,
    categorize: (f: Feature<Point, Props>) => Answer[],
): FeatureCollection<Point, Props & { possibleAnswers: Answer[] }> {
    return withPropertiesInCollection(collection, (f) => ({ possibleAnswers: categorize(f) }));
}

/**
 * Creates `categorizer` function for `withPossibleAnswers` for binary-splitting questions,
 * based on distance comparison.
 *
 * If `dist` returns a negative number, `[negative]` is returned; otherwise `[positive]` is returned.
 * However if `Math.abs(dist) <= tolerance`, both answers are returned.
 */
export function binaryCategorizer<
    Negative extends string,
    Positive extends string,
    Props extends object,
>(
    dist: (f: Feature<Point, Props>) => number,
    tolerance: number,
    negative: Negative,
    positive: Positive,
): (f: Feature<Point, Props>) => (Negative | Positive)[] {
    return (feature) => {
        const d = dist(feature);
        if (Math.abs(d) <= tolerance) return [negative, positive];
        return [d < 0 ? negative : positive];
    };
}

export function hasAnswer(possible: Iterable<PossibleAnswer>, id: string): boolean {
    for (const p of possible) {
        if (answerId(p) === id) return true;
    }
    return false;
}

export function answerId(a: PossibleAnswer): string {
    return typeof a === "string" ? a : a[0];
}

export function answerName(a: PossibleAnswer): string {
    return typeof a === "string" ? a : a[1];
}
