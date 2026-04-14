// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { BBox, FeatureCollection, Point, Position } from "geojson";
import * as z from "zod";
import { withPossibleAnswers } from "../../helper/geo";

export type T = z.infer<typeof schema>;

export const schema = z.object({
    kind: z.literal("custom"),
    name: z.string(),
    answer: z.string().optional(),
});

export function name(q: T): string {
    return q.name;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function empty(_seeker: Position): T {
    return { kind: "custom", name: "Custom: empty" };
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function answers(_q: T): never[] {
    return [];
}

export function categorize<P extends { [name: string]: unknown }>(
    _q: T,
    stations: FeatureCollection<Point, P>,
): FeatureCollection<Point, P & { possibleAnswers: never[] }> {
    return withPossibleAnswers(stations, () => []);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function divideArea(_q: T, _extent: BBox): null {
    return null;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function withPosition(q: T, _newPosition: (number | null)[]): T {
    return q;
}
