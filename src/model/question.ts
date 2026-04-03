// SPDX-FileCopyrightText: 2026 Mikołaj Kuranowski
// SPDX-License-Identifier: GPL-3.0-or-later

import type {
    Feature,
    FeatureCollection,
    LineString,
    MultiPolygon,
    Point,
    Polygon,
    Position,
} from "geojson";
import * as turf from "@turf/turf";

export interface Properties {
    id: string;
    name?: string | undefined;
    [name: string]: unknown;
}

export interface NearestPointProperties extends Properties {
    featureIndex: number;
    distanceToPoint: number;
}

export type QuestionKind = "match" | "measure" | "radar" | "thermometer" | "tentacles" | "custom";

export abstract class Question<Answer extends string | null = string | null> {
    answer: Answer | null = null;

    abstract get kind(): QuestionKind;
    abstract get name(): string;
    abstract categorizePoint(pos: Position, tolerance: number): Answer | null;
}

export class CustomQuestion extends Question<null> {
    name: string;

    constructor(name: string) {
        super();
        this.name = name;
    }

    get kind(): "custom" {
        return "custom";
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    categorizePoint(_pos: Position, _tolerance: number): null {
        return null;
    }
}

export abstract class BinaryDistanceQuestion<
    NegativeAnswer extends string,
    PositiveAnswer extends string,
> extends Question<NegativeAnswer | PositiveAnswer> {
    #negativeAnswer: NegativeAnswer;
    #positiveAnswer: PositiveAnswer;

    constructor(negativeAnswer: NegativeAnswer, positiveAnswer: PositiveAnswer) {
        super();
        this.#negativeAnswer = negativeAnswer;
        this.#positiveAnswer = positiveAnswer;
    }

    abstract calculateDistanceDelta(pos: Position): number;

    categorizePoint(pos: Position, tolerance: number): NegativeAnswer | PositiveAnswer | null {
        const delta = this.calculateDistanceDelta(pos);

        if (Math.abs(delta) <= tolerance) return null;
        return delta < 0 ? this.#negativeAnswer : this.#positiveAnswer;
    }
}

export class MatchAreaQuestion extends BinaryDistanceQuestion<"hit", "miss"> {
    area: Feature<Polygon | MultiPolygon, Properties>;

    constructor(area: Feature<Polygon | MultiPolygon, Properties>) {
        super("hit", "miss");
        this.area = area;
    }

    get kind(): "match" {
        return "match";
    }

    get name(): string {
        return `Match: ${this.area.properties.name ?? this.area.properties.id}`;
    }

    calculateDistanceDelta(pos: Position): number {
        return turf.pointToPolygonDistance(pos, this.area);
    }
}

export class MatchPointQuestion extends BinaryDistanceQuestion<"hit", "miss"> {
    presetName: string;
    candidates: FeatureCollection<Point, Properties>;

    #seeker: Position;
    #closest: Feature<Point, NearestPointProperties>;

    constructor(
        presetName: string,
        candidates: FeatureCollection<Point, Properties>,
        seeker: Position,
    ) {
        super("hit", "miss");
        this.presetName = presetName;
        this.candidates = candidates;
        this.#seeker = seeker;
        this.#closest = turf.nearestPoint(seeker, this.candidates);
    }

    get kind(): "match" {
        return "match";
    }

    get name(): string {
        return `Match ${this.presetName}`;
    }

    get seeker(): Position {
        return this.#seeker;
    }

    set seeker(pos: Position) {
        this.#seeker = pos;
        this.#closest = turf.nearestPoint(pos, this.candidates);
    }

    get closest(): Feature<Point, NearestPointProperties> {
        return this.#closest;
    }

    calculateDistanceDelta(pos: Position): number {
        const distances = this.candidates.features.map((c) => turf.distance(pos, c));
        const [distanceToMatched] = distances.splice(this.#closest.properties.featureIndex, 1);
        const distanceToOther = Math.min(...distances);
        return distanceToMatched - distanceToOther;
    }
}

export class MeasureQuestion extends BinaryDistanceQuestion<"closer", "further"> {
    presetName: string;
    candidates: FeatureCollection<Point | LineString, Properties>;
    #seeker: Position;
    #distance: number;

    constructor(
        presetName: string,
        candidates: FeatureCollection<Point | LineString, Properties>,
        seeker: Position,
    ) {
        super("closer", "further");
        this.presetName = presetName;
        this.candidates = candidates;
        this.#seeker = seeker;
        this.#distance = Math.min(...candidates.features.map((f) => distanceToFeature(seeker, f)));
    }

    get kind(): "measure" {
        return "measure";
    }

    get name(): string {
        return `Measure ${this.presetName}`;
    }

    get seeker(): Position {
        return this.#seeker;
    }

    set seeker(pos: Position) {
        this.#seeker = pos;
        this.#distance = Math.min(
            ...this.candidates.features.map((f) => distanceToFeature(pos, f)),
        );
    }

    get distance(): number {
        return this.#distance;
    }

    calculateDistanceDelta(pos: Position): number {
        const distance = Math.min(
            ...this.candidates.features.map((f) => distanceToFeature(pos, f)),
        );
        return distance - this.#distance;
    }
}

export class RadarQuestion extends BinaryDistanceQuestion<"hit", "miss"> {
    seeker: Position;
    radius: number;

    constructor(seeker: Position, radius: number) {
        super("hit", "miss");
        this.seeker = seeker;
        this.radius = radius;
    }

    get kind(): "radar" {
        return "radar";
    }

    get name(): string {
        return `Radar ${this.radius.toFixed(1)} km`;
    }

    calculateDistanceDelta(pos: Position): number {
        return turf.distance(pos, this.seeker) - this.radius;
    }
}

export class ThermometerQuestion extends BinaryDistanceQuestion<"colder", "hotter"> {
    start: Position;
    end: Position;

    constructor(start: Position, end: Position) {
        super("colder", "hotter");
        this.start = start;
        this.end = end;
    }

    get kind(): "thermometer" {
        return "thermometer";
    }

    get name(): string {
        const distance = turf.distance(this.start, this.end);
        return `Thermometer ${distance.toFixed(1)} km`;
    }

    calculateDistanceDelta(pos: Position): number {
        return turf.distance(pos, this.start) - turf.distance(pos, this.end);
    }
}

export class TentaclesQuestion extends Question<string> {
    presetName: string;
    candidates: FeatureCollection<Point, Properties>;
    #radius: number;
    #seeker: Position;
    #viableCandidates: FeatureCollection<Point, Properties>;

    constructor(
        presetName: string,
        candidates: FeatureCollection<Point, Properties>,
        radius: number,
        seeker: Position,
    ) {
        super();
        this.presetName = presetName;
        this.candidates = candidates;
        this.#radius = radius;
        this.#seeker = seeker;
        this.#viableCandidates = this.calculateViableCandidates();
    }

    private calculateViableCandidates(): FeatureCollection<Point, Properties> {
        return turf.featureCollection(
            this.candidates.features.filter((f) => turf.distance(f, this.#seeker) < this.#radius),
        );
    }

    get kind(): "tentacles" {
        return "tentacles";
    }

    get name(): string {
        return `Tentacles ${this.presetName}`;
    }

    get seeker(): Position {
        return this.#seeker;
    }

    set seeker(pos: Position) {
        this.#seeker = pos;
        this.#viableCandidates = this.calculateViableCandidates();
    }

    get radius(): number {
        return this.#radius;
    }

    set radius(r: number) {
        this.#radius = r;
        this.#viableCandidates = this.calculateViableCandidates();
    }

    get viableCandidates(): FeatureCollection<Point, Properties> {
        return this.#viableCandidates;
    }

    categorizePoint(pos: Position, tolerance: number): string {
        // Shortcut - without any viable candidates, no non-nil answer is possible
        if (this.#viableCandidates.features.length === 0) return "(nil)";

        // Check if miss is the only possible outcome
        const distanceToRoot = turf.distance(pos, this.#seeker);
        if (distanceToRoot > this.#radius + tolerance) return "(nil)";

        // Check if miss is possible
        const matches: string[] = [];
        if (distanceToRoot >= this.#radius - tolerance) matches.push("(nil)");

        // Check which candidates could be returned
        const distances = this.#viableCandidates.features.map((c) => turf.distance(pos, c));
        const closest = Math.min(...distances);
        matches.push(
            ...this.#viableCandidates.features
                .map((c) => c.properties.id)
                .filter((_, i) => distances[i] <= closest + tolerance),
        );

        return matches.join(";");
    }
}

function distanceToFeature(
    pt: Position,
    f: Feature<Point | LineString | Polygon | MultiPolygon>,
): number {
    switch (f.geometry.type) {
        case "Point":
            return turf.distance(pt, f.geometry.coordinates);

        case "LineString":
            return turf.pointToLineDistance(pt, f.geometry);

        case "Polygon":
        case "MultiPolygon":
            return turf.pointToPolygonDistance(pt, f.geometry);
    }
}
