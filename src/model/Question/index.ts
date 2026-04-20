// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type { BBox, FeatureCollection, MultiPolygon, Point, Polygon, Position } from "geojson";
import * as z from "zod";
import type { PropertiesWithAnswer } from "../Geo";
import * as CustomQuestion from "./CustomQuestion";
import * as MatchAreaQuestion from "./MatchAreaQuestion";
import * as MatchPointQuestion from "./MatchPointQuestion";
import * as MeasureQuestion from "./MeasureQuestion";
import * as RadarQuestion from "./RadarQuestion";
import * as TentaclesQuestion from "./TentaclesQuestion";
import * as ThermometerQuestion from "./ThermometerQuestion";

export type T<NarrowKind extends Kind = Kind> = {
    [K in NarrowKind]: { kind: K } & TLookup[K];
}[NarrowKind];

export type Kind = keyof TLookup;

interface TLookup {
    custom: CustomQuestion.T;
    "match-area": MatchAreaQuestion.T;
    "match-point": MatchPointQuestion.T;
    measure: MeasureQuestion.T;
    radar: RadarQuestion.T;
    tentacles: TentaclesQuestion.T;
    thermometer: ThermometerQuestion.T;
}

interface Submodule<T> {
    name(q: T): string;
    empty(seeker: Position): T;
    answers(q: T): string[];
    categorize<P extends { [name: string]: unknown }>(
        q: T,
        stations: FeatureCollection<Point, P>,
        tolerance: number,
    ): FeatureCollection<Point, P & { possibleAnswers: string[] }>;
    divideArea(
        q: T,
        extent: BBox,
    ): FeatureCollection<Polygon | MultiPolygon, PropertiesWithAnswer> | null;

    withPosition(q: T, newPosition: (number | null)[]): T;
}

type Submodules = { [K in Kind]: Submodule<TLookup[K]> };

const submodules: Submodules = {
    custom: CustomQuestion,
    "match-area": MatchAreaQuestion,
    "match-point": MatchPointQuestion,
    measure: MeasureQuestion,
    radar: RadarQuestion,
    tentacles: TentaclesQuestion,
    thermometer: ThermometerQuestion,
};

export function name<K extends Kind>(q: T<K>): string {
    return submodules[q.kind].name(q);
}

export function empty<K extends Kind>(kind: K, seeker: Position): TLookup[K] {
    return submodules[kind].empty(seeker);
}

export function isBinary(kind: Kind): boolean {
    switch (kind) {
        case "match-area":
        case "match-point":
        case "measure":
        case "radar":
        case "thermometer":
            return true;

        default:
            return false;
    }
}

export function answers<K extends Kind>(q: T<K>): string[] {
    return submodules[q.kind].answers(q);
}

export function categorize<K extends Kind, P extends { [name: string]: unknown }>(
    q: T<K>,
    stations: FeatureCollection<Point, P>,
    tolerance: number,
): FeatureCollection<Point, P & { possibleAnswers: string[] }> {
    return submodules[q.kind].categorize(q, stations, tolerance);
}

export function divideArea<K extends Kind>(
    q: T<K>,
    extent: BBox,
): FeatureCollection<Polygon | MultiPolygon, PropertiesWithAnswer> | null {
    return submodules[q.kind].divideArea(q, extent);
}

export function withPosition<K extends Kind>(q: T<K>, newPosition: (number | null)[]): TLookup[K] {
    return submodules[q.kind].withPosition(q, newPosition);
}

export function withAnswer<K extends Kind>(q: T<K>, answer: string | undefined): TLookup[K] {
    if (answer === undefined) {
        // Special case - remove `answer` and `answeredAt`
        const copy = { ...q };
        delete copy.answer;
        delete copy.answeredAt;
        return copy;
    }

    const validAnswers = answers(q);
    if (validAnswers.length > 0 && !validAnswers.includes(answer)) {
        throw new TypeError(`invalid answer for question ${name(q)}: ${answer}`);
    }

    const answeredAt = q.answeredAt?.explicit ? q.answeredAt : { t: new Date().toISOString() };
    return { ...q, answer, answeredAt };
}

export const schema = z.discriminatedUnion("kind", [
    CustomQuestion.schema,
    MatchAreaQuestion.schema,
    MatchPointQuestion.schema,
    MeasureQuestion.schema,
    RadarQuestion.schema,
    TentaclesQuestion.schema,
    ThermometerQuestion.schema,
]);
